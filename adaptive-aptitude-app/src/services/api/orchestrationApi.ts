// src/services/api/orchestrationApi.ts
import { apiClient } from './apiClient';
import type {
  NextActionWireResponse,
  DailyAgendaWireResponse,
  InterventionListWireResponse,
  PrescriptionLeaseWireResponse,
  PrescriptionCompletePayload,
  PrescriptionCompleteWireResponse,
  PrescriptionIssuanceRequestPayload,
  AttributionIssuanceWireResponse,
} from '../../types/api';

/**
 * Operation 53: GET /api/v1/orchestration/next-action
 */
export async function fetchNextAction(
  params: { userId: string; goalId?: string }
): Promise<NextActionWireResponse> {
  return apiClient.get<NextActionWireResponse>(
    '/api/v1/orchestration/next-action',
    { params }
  );
}

/**
 * Operation 54: GET /api/v1/orchestration/daily-agenda
 */
export async function fetchDailyAgenda(
  params: { userId: string; goalId?: string }
): Promise<DailyAgendaWireResponse> {
  return apiClient.get<DailyAgendaWireResponse>(
    '/api/v1/orchestration/daily-agenda',
    { params }
  );
}

/**
 * Operation 55: GET /api/v1/orchestration/interventions
 */
export async function fetchInterventions(
  params: { userId: string; goalId?: string }
): Promise<InterventionListWireResponse> {
  return apiClient.get<InterventionListWireResponse>(
    '/api/v1/orchestration/interventions',
    { params }
  );
}

/**
 * Operation 56: POST /api/v1/attribution/prescriptions/:prescriptionId/activate
 */
export async function activatePrescription(
  prescriptionId: string
): Promise<PrescriptionLeaseWireResponse> {
  return apiClient.post<PrescriptionLeaseWireResponse>(
    `/api/v1/attribution/prescriptions/${prescriptionId}/activate`
  );
}

/**
 * Operation 57: POST /api/v1/attribution/prescriptions/:prescriptionId/complete
 */
export async function completePrescription(
  prescriptionId: string,
  payload?: PrescriptionCompletePayload
): Promise<PrescriptionCompleteWireResponse> {
  return apiClient.post<PrescriptionCompleteWireResponse>(
    `/api/v1/attribution/prescriptions/${prescriptionId}/complete`,
    payload
  );
}

/**
 * Operation 64: POST /api/v1/attribution/prescriptions
 * Requires valid Idempotency-Key header.
 */
export async function issuePrescription(
  payload: PrescriptionIssuanceRequestPayload,
  idempotencyKey: string
): Promise<AttributionIssuanceWireResponse> {
  return apiClient.post<AttributionIssuanceWireResponse>(
    '/api/v1/attribution/prescriptions',
    payload,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
}
