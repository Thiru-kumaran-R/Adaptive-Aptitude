const CANONICAL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'OTHER'];
const CANONICAL_STATUS_CLASSES = ['2xx', '3xx', '4xx', '5xx', 'OTHER'];
const HTTP_DURATION_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const HTTP_REQUEST_SERIES_CAP = 500;
const HTTP_DURATION_SERIES_CAP = 150;

// Internal storage
let counters = new Map();
let gauges = new Map();
let histograms = new Map();

const serializeLabels = (labels) => {
  const keys = Object.keys(labels).sort((a, b) => {
    if (a === 'le') return 1;
    if (b === 'le') return -1;
    return a.localeCompare(b);
  });
  if (keys.length === 0) return '';
  return keys.map((k) => `${k}="${String(labels[k]).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',');
};

const preallocateOverflowSeries = () => {
  // Preallocate 8 counter overflow series for http_requests_total
  for (const method of CANONICAL_METHODS) {
    const labels = { method, route: 'OTHER', statusClass: 'OTHER' };
    const key = `http_requests_total{${serializeLabels(labels)}}`;
    if (!counters.has(key)) {
      counters.set(key, { name: 'http_requests_total', labels, value: 0 });
    }
  }

  // Preallocate 8 histogram overflow series for http_request_duration_ms
  for (const method of CANONICAL_METHODS) {
    const labels = { method, route: 'OTHER' };
    const key = `http_request_duration_ms{${serializeLabels(labels)}}`;
    if (!histograms.has(key)) {
      histograms.set(key, {
        name: 'http_request_duration_ms',
        labels,
        buckets: HTTP_DURATION_BUCKETS_MS.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0
      });
    }
  }
};

const initRegistry = () => {
  counters.clear();
  gauges.clear();
  histograms.clear();

  // Initialize single-instance gauges
  gauges.set('http_active_requests{}', { name: 'http_active_requests', labels: {}, value: 0 });
  gauges.set('mongodb_connection_status{}', { name: 'mongodb_connection_status', labels: {}, value: 0 });
  gauges.set('mongodb_ping_duration_ms{}', { name: 'mongodb_ping_duration_ms', labels: {}, value: 0 });

  preallocateOverflowSeries();
};

initRegistry();

const incrementCounter = (name, labels = {}, value = 1) => {
  try {
    const numVal = typeof value === 'number' && !isNaN(value) ? value : 1;
    const labelStr = serializeLabels(labels);
    const key = `${name}{${labelStr}}`;

    if (counters.has(key)) {
      const entry = counters.get(key);
      entry.value += numVal;
      return;
    }

    if (name === 'http_requests_total') {
      if (counters.size < HTTP_REQUEST_SERIES_CAP) {
        counters.set(key, { name, labels: { ...labels }, value: numVal });
      } else {
        const method = labels.method && CANONICAL_METHODS.includes(labels.method) ? labels.method : 'OTHER';
        const overflowLabels = { method, route: 'OTHER', statusClass: 'OTHER' };
        const overflowKey = `http_requests_total{${serializeLabels(overflowLabels)}}`;
        const overflowEntry = counters.get(overflowKey);
        if (overflowEntry) {
          overflowEntry.value += numVal;
        }
      }
      return;
    }

    // Other counters (e.g. phase13_lifecycle_events_total)
    counters.set(key, { name, labels: { ...labels }, value: numVal });
  } catch (_err) {}
};

const recordHistogram = (name, labels = {}, value) => {
  try {
    const numVal = typeof value === 'number' && !isNaN(value) ? value : 0;
    const labelStr = serializeLabels(labels);
    const key = `${name}{${labelStr}}`;

    let entry = histograms.get(key);

    if (!entry) {
      if (name === 'http_request_duration_ms') {
        if (histograms.size < HTTP_DURATION_SERIES_CAP) {
          entry = {
            name,
            labels: { ...labels },
            buckets: HTTP_DURATION_BUCKETS_MS.map((le) => ({ le, count: 0 })),
            sum: 0,
            count: 0
          };
          histograms.set(key, entry);
        } else {
          const method = labels.method && CANONICAL_METHODS.includes(labels.method) ? labels.method : 'OTHER';
          const overflowLabels = { method, route: 'OTHER' };
          const overflowKey = `http_request_duration_ms{${serializeLabels(overflowLabels)}}`;
          entry = histograms.get(overflowKey);
        }
      } else {
        entry = {
          name,
          labels: { ...labels },
          buckets: HTTP_DURATION_BUCKETS_MS.map((le) => ({ le, count: 0 })),
          sum: 0,
          count: 0
        };
        histograms.set(key, entry);
      }
    }

    if (entry) {
      entry.sum += numVal;
      entry.count += 1;
      for (const bucket of entry.buckets) {
        if (numVal <= bucket.le) {
          bucket.count += 1;
        }
      }
    }
  } catch (_err) {}
};

const setGauge = (name, labels = {}, value) => {
  try {
    const numVal = typeof value === 'number' && !isNaN(value) ? value : 0;
    const labelStr = serializeLabels(labels);
    const key = `${name}{${labelStr}}`;
    gauges.set(key, { name, labels: { ...labels }, value: numVal });
  } catch (_err) {}
};

const toPrometheusText = () => {
  try {
    const lines = [];

    // 1. http_requests_total
    lines.push('# HELP http_requests_total Total number of HTTP requests processed');
    lines.push('# TYPE http_requests_total counter');
    for (const entry of counters.values()) {
      if (entry.name === 'http_requests_total') {
        const labelStr = serializeLabels(entry.labels);
        lines.push(`http_requests_total{${labelStr}} ${entry.value}`);
      }
    }

    // 2. http_request_duration_ms
    lines.push('# HELP http_request_duration_ms Latency of HTTP requests in milliseconds');
    lines.push('# TYPE http_request_duration_ms histogram');
    for (const entry of histograms.values()) {
      if (entry.name === 'http_request_duration_ms') {
        const baseLabels = { ...entry.labels };
        for (const bucket of entry.buckets) {
          const bucketLabels = { ...baseLabels, le: String(bucket.le) };
          lines.push(`http_request_duration_ms_bucket{${serializeLabels(bucketLabels)}} ${bucket.count}`);
        }
        const infLabels = { ...baseLabels, le: '+Inf' };
        lines.push(`http_request_duration_ms_bucket{${serializeLabels(infLabels)}} ${entry.count}`);
        lines.push(`http_request_duration_ms_sum{${serializeLabels(baseLabels)}} ${entry.sum}`);
        lines.push(`http_request_duration_ms_count{${serializeLabels(baseLabels)}} ${entry.count}`);
      }
    }

    // 3. http_active_requests
    lines.push('# HELP http_active_requests Current number of active in-flight HTTP requests');
    lines.push('# TYPE http_active_requests gauge');
    const activeReq = gauges.get('http_active_requests{}')?.value ?? 0;
    lines.push(`http_active_requests ${activeReq}`);

    // 4. mongodb_connection_status
    lines.push('# HELP mongodb_connection_status MongoDB connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)');
    lines.push('# TYPE mongodb_connection_status gauge');
    const dbStatus = gauges.get('mongodb_connection_status{}')?.value ?? 0;
    lines.push(`mongodb_connection_status ${dbStatus}`);

    // 5. mongodb_ping_duration_ms
    lines.push('# HELP mongodb_ping_duration_ms Duration of the last MongoDB ping in milliseconds');
    lines.push('# TYPE mongodb_ping_duration_ms gauge');
    const pingDur = gauges.get('mongodb_ping_duration_ms{}')?.value ?? 0;
    lines.push(`mongodb_ping_duration_ms ${pingDur}`);

    // 6. process_uptime_seconds
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Number(process.uptime())}`);

    // 7. health_probe_status
    lines.push('# HELP health_probe_status Health probe status (1=healthy, 0=unhealthy)');
    lines.push('# TYPE health_probe_status gauge');
    for (const entry of gauges.values()) {
      if (entry.name === 'health_probe_status') {
        const labelStr = serializeLabels(entry.labels);
        lines.push(`health_probe_status{${labelStr}} ${entry.value}`);
      }
    }

    // 8. phase13_lifecycle_events_total
    lines.push('# HELP phase13_lifecycle_events_total Total lifecycle events observed');
    lines.push('# TYPE phase13_lifecycle_events_total counter');
    for (const entry of counters.values()) {
      if (entry.name === 'phase13_lifecycle_events_total') {
        const labelStr = serializeLabels(entry.labels);
        lines.push(`phase13_lifecycle_events_total{${labelStr}} ${entry.value}`);
      }
    }

    return lines.join('\n') + '\n';
  } catch (_err) {
    return '';
  }
};

const getMetricsJSON = () => {
  try {
    const countersObj = {};
    for (const entry of counters.values()) {
      if (!countersObj[entry.name]) countersObj[entry.name] = [];
      countersObj[entry.name].push({ labels: { ...entry.labels }, value: entry.value });
    }

    const gaugesObj = {};
    for (const entry of gauges.values()) {
      if (!gaugesObj[entry.name]) gaugesObj[entry.name] = [];
      gaugesObj[entry.name].push({ labels: { ...entry.labels }, value: entry.value });
    }
    // Dynamic uptime
    gaugesObj['process_uptime_seconds'] = [{ labels: {}, value: Number(process.uptime()) }];

    const histogramsObj = {};
    for (const entry of histograms.values()) {
      if (!histogramsObj[entry.name]) histogramsObj[entry.name] = [];
      histogramsObj[entry.name].push({
        labels: { ...entry.labels },
        buckets: entry.buckets.map((b) => ({ ...b })),
        sum: entry.sum,
        count: entry.count
      });
    }

    return {
      uptimeSeconds: Number(process.uptime()),
      counters: countersObj,
      gauges: gaugesObj,
      histograms: histogramsObj
    };
  } catch (_err) {
    return {
      uptimeSeconds: Number(process.uptime()),
      counters: {},
      gauges: {},
      histograms: {}
    };
  }
};

const resetRegistryForTesting = () => {
  initRegistry();
};

module.exports = {
  incrementCounter,
  recordHistogram,
  setGauge,
  toPrometheusText,
  getMetricsJSON,
  resetRegistryForTesting
};
