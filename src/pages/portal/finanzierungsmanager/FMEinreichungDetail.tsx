/**
 * FMEinreichungDetail — Wrapper that renders FMEinreichung with pre-selected case.
 * The actual workflow is now inline in FMEinreichung (master-detail).
 */
import { useParams } from 'react-router-dom';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';
import FMEinreichung from './FMEinreichung';

export default function FMEinreichungDetail() {
  const { data: cases, isLoading } = useFutureRoomCases();
  return <FMEinreichung cases={cases || []} isLoading={isLoading} />;
}
