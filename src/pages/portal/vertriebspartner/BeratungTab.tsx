import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { useState } from 'react';

const BeratungTab = () => {
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);

  const handleResult = (result: CalculationResult) => {
    setLastResult(result);
  };

  return (
    <div>
      <InvestmentCalculator onResult={handleResult} />
    </div>
  );
};

export default BeratungTab;
