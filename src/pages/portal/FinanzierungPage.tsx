import { Routes, Route } from 'react-router-dom';
import { FinanceRequestList, FinanceRequestDetail } from '@/components/finanzierung';

const FinanzierungPage = () => {
  return (
    <div className="p-6">
      <Routes>
        <Route index element={<FinanceRequestList />} />
        <Route path=":id" element={<FinanceRequestDetail />} />
      </Routes>
    </div>
  );
};

export default FinanzierungPage;
