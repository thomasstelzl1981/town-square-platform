import { Routes, Route, Navigate } from 'react-router-dom';
import { FinanceRequestList, FinanceRequestDetail } from '@/components/finanzierung';

export default function FaelleTab() {
  return (
    <Routes>
      <Route index element={<FinanceRequestList />} />
      <Route path=":id/*" element={<FinanceRequestDetail />} />
    </Routes>
  );
}
