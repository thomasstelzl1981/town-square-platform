import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================
// TYPES
// =============================================
interface CalculationInput {
  purchasePrice: number
  monthlyRent: number
  equity: number
  termYears: number // 5, 10, 15, 20, 25, 30
  repaymentRate: number // 1-5%
  taxableIncome: number // zvE
  maritalStatus: 'single' | 'married'
  hasChurchTax: boolean
  churchTaxState?: string // Bundesland-Code
  afaModel: 'linear' | '7i' | '7h' | '7b'
  buildingShare: number // Gebäudeanteil (0-1)
  managementCostMonthly: number
  valueGrowthRate: number // % p.a.
  rentGrowthRate: number // % p.a.
}

interface YearlyData {
  year: number
  rent: number
  interest: number
  repayment: number
  remainingDebt: number
  managementCost: number
  afa: number
  taxableRentalIncome: number
  taxSavings: number
  cashFlowBeforeTax: number
  cashFlowAfterTax: number
  propertyValue: number
  netWealth: number
}

interface CalculationResult {
  summary: {
    monthlyBurden: number
    totalInvestment: number
    loanAmount: number
    ltv: number
    interestRate: number
    yearlyRent: number
    yearlyInterest: number
    yearlyRepayment: number
    yearlyAfa: number
    yearlyTaxSavings: number
    roiBeforeTax: number
    roiAfterTax: number
  }
  projection: YearlyData[]
  inputs: CalculationInput
}

// =============================================
// BMF PAP SIMPLIFIED TAX CALCULATION
// =============================================
function calculateIncomeTax(zvE: number, maritalStatus: 'single' | 'married'): number {
  // German income tax formula 2024 (simplified BMF PAP)
  const taxableIncome = maritalStatus === 'married' ? zvE / 2 : zvE
  let tax = 0

  if (taxableIncome <= 11604) {
    tax = 0
  } else if (taxableIncome <= 17005) {
    const y = (taxableIncome - 11604) / 10000
    tax = (922.98 * y + 1400) * y
  } else if (taxableIncome <= 66760) {
    const z = (taxableIncome - 17005) / 10000
    tax = (181.19 * z + 2397) * z + 1025.38
  } else if (taxableIncome <= 277825) {
    tax = 0.42 * taxableIncome - 10602.13
  } else {
    tax = 0.45 * taxableIncome - 18936.88
  }

  // Double for married (Splittingtarif)
  if (maritalStatus === 'married') {
    tax = tax * 2
  }

  return Math.max(0, Math.round(tax * 100) / 100)
}

function calculateSoli(incomeTax: number): number {
  // Soli: 5.5% on income tax (with exemption threshold)
  if (incomeTax <= 18130) return 0 // Simplified threshold
  return Math.round(incomeTax * 0.055 * 100) / 100
}

function calculateChurchTax(incomeTax: number, rate: number): number {
  return Math.round(incomeTax * (rate / 100) * 100) / 100
}

// =============================================
// MAIN CALCULATION ENGINE
// =============================================
async function calculateInvestment(
  input: CalculationInput,
  interestRates: Map<string, number>,
  taxParams: Map<string, number>,
  churchTaxRate: number
): Promise<CalculationResult> {
  const {
    purchasePrice,
    monthlyRent,
    equity,
    termYears,
    repaymentRate,
    taxableIncome,
    maritalStatus,
    hasChurchTax,
    afaModel,
    buildingShare,
    managementCostMonthly,
    valueGrowthRate,
    rentGrowthRate
  } = input

  // Calculate loan and LTV
  const loanAmount = purchasePrice - equity
  const ltv = Math.round((loanAmount / purchasePrice) * 100)
  
  // Get interest rate from matrix (round LTV to nearest 10)
  const ltvBracket = Math.min(100, Math.max(60, Math.ceil(ltv / 10) * 10))
  const interestRateKey = `${termYears}_${ltvBracket}`
  const interestRate = interestRates.get(interestRateKey) || 4.5

  // Get AfA rate
  const afaRates: Record<string, number> = {
    linear: taxParams.get('AFA_LINEAR') || 2,
    '7i': taxParams.get('AFA_7I') || 9,
    '7h': taxParams.get('AFA_7H') || 9,
    '7b': taxParams.get('AFA_7B') || 5
  }
  const afaRate = afaRates[afaModel]
  const buildingValue = purchasePrice * buildingShare
  const yearlyAfa = buildingValue * (afaRate / 100)

  // Calculate yearly values
  const yearlyRent = monthlyRent * 12
  const yearlyManagement = managementCostMonthly * 12
  const yearlyInterest = loanAmount * (interestRate / 100)
  const yearlyRepayment = loanAmount * (repaymentRate / 100)

  // Tax calculation: Compare zvE without vs with property
  const taxOld = calculateIncomeTax(taxableIncome, maritalStatus)
  const soliOld = calculateSoli(taxOld)
  const churchOld = hasChurchTax ? calculateChurchTax(taxOld, churchTaxRate) : 0

  // Rental income reduces taxable income (losses from renting)
  const taxableRentalIncome = yearlyRent - yearlyInterest - yearlyManagement - yearlyAfa
  const zvENew = taxableIncome + taxableRentalIncome // Can be negative (loss)
  
  const taxNew = calculateIncomeTax(Math.max(0, zvENew), maritalStatus)
  const soliNew = calculateSoli(taxNew)
  const churchNew = hasChurchTax ? calculateChurchTax(taxNew, churchTaxRate) : 0

  const totalTaxOld = taxOld + soliOld + churchOld
  const totalTaxNew = taxNew + soliNew + churchNew
  const yearlyTaxSavings = totalTaxOld - totalTaxNew

  // Monthly burden calculation
  const yearlyCashFlowBeforeTax = yearlyRent - yearlyInterest - yearlyManagement - yearlyRepayment
  const yearlyCashFlowAfterTax = yearlyCashFlowBeforeTax + yearlyTaxSavings
  const monthlyBurden = -yearlyCashFlowAfterTax / 12 // Positive = you pay, negative = you receive

  // Calculate ROI
  const totalInvestment = equity
  const roiBeforeTax = ((yearlyRent - yearlyInterest - yearlyManagement) / totalInvestment) * 100
  const roiAfterTax = ((yearlyRent - yearlyInterest - yearlyManagement + yearlyTaxSavings) / totalInvestment) * 100

  // 40-year projection
  const projection: YearlyData[] = []
  let remainingDebt = loanAmount
  let currentPropertyValue = purchasePrice
  let currentRent = yearlyRent

  for (let year = 1; year <= 40; year++) {
    // Apply growth rates
    if (year > 1) {
      currentPropertyValue *= (1 + valueGrowthRate / 100)
      currentRent *= (1 + rentGrowthRate / 100)
    }

    const yearInterest = remainingDebt * (interestRate / 100)
    const yearRepayment = Math.min(remainingDebt, loanAmount * (repaymentRate / 100))
    remainingDebt = Math.max(0, remainingDebt - yearRepayment)

    const yearTaxableRental = currentRent - yearInterest - yearlyManagement - yearlyAfa
    const yearZvENew = taxableIncome + yearTaxableRental
    const yearTaxNew = calculateIncomeTax(Math.max(0, yearZvENew), maritalStatus)
    const yearSoliNew = calculateSoli(yearTaxNew)
    const yearChurchNew = hasChurchTax ? calculateChurchTax(yearTaxNew, churchTaxRate) : 0
    const yearTotalTaxNew = yearTaxNew + yearSoliNew + yearChurchNew
    const yearTaxSavings = totalTaxOld - yearTotalTaxNew

    const yearCashFlowBefore = currentRent - yearInterest - yearlyManagement - yearRepayment
    const yearCashFlowAfter = yearCashFlowBefore + yearTaxSavings

    projection.push({
      year,
      rent: Math.round(currentRent),
      interest: Math.round(yearInterest),
      repayment: Math.round(yearRepayment),
      remainingDebt: Math.round(remainingDebt),
      managementCost: Math.round(yearlyManagement),
      afa: Math.round(yearlyAfa),
      taxableRentalIncome: Math.round(yearTaxableRental),
      taxSavings: Math.round(yearTaxSavings),
      cashFlowBeforeTax: Math.round(yearCashFlowBefore),
      cashFlowAfterTax: Math.round(yearCashFlowAfter),
      propertyValue: Math.round(currentPropertyValue),
      netWealth: Math.round(currentPropertyValue - remainingDebt)
    })
  }

  return {
    summary: {
      monthlyBurden: Math.round(monthlyBurden),
      totalInvestment: Math.round(totalInvestment),
      loanAmount: Math.round(loanAmount),
      ltv,
      interestRate,
      yearlyRent: Math.round(yearlyRent),
      yearlyInterest: Math.round(yearlyInterest),
      yearlyRepayment: Math.round(yearlyRepayment),
      yearlyAfa: Math.round(yearlyAfa),
      yearlyTaxSavings: Math.round(yearlyTaxSavings),
      roiBeforeTax: Math.round(roiBeforeTax * 100) / 100,
      roiAfterTax: Math.round(roiAfterTax * 100) / 100
    },
    projection,
    inputs: input
  }
}

// =============================================
// EDGE FUNCTION HANDLER
// =============================================
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const input: CalculationInput = await req.json()
    console.log('Investment Engine: Received input', JSON.stringify(input))

    // Fetch interest rates from database
    const { data: ratesData, error: ratesError } = await supabase
      .from('interest_rates')
      .select('term_years, ltv_percent, interest_rate')
      .is('valid_until', null)

    if (ratesError) {
      console.error('Error fetching interest rates:', ratesError)
      throw new Error('Failed to fetch interest rates')
    }

    const interestRates = new Map<string, number>()
    ratesData?.forEach(r => {
      interestRates.set(`${r.term_years}_${r.ltv_percent}`, Number(r.interest_rate))
    })
    console.log('Interest rates loaded:', interestRates.size)

    // Fetch tax parameters
    const { data: taxData, error: taxError } = await supabase
      .from('tax_parameters')
      .select('code, value')
      .is('valid_until', null)

    if (taxError) {
      console.error('Error fetching tax parameters:', taxError)
      throw new Error('Failed to fetch tax parameters')
    }

    const taxParams = new Map<string, number>()
    taxData?.forEach(t => {
      taxParams.set(t.code, Number(t.value))
    })
    console.log('Tax parameters loaded:', taxParams.size)

    // Fetch church tax rate if needed
    let churchTaxRate = 9 // Default
    if (input.hasChurchTax && input.churchTaxState) {
      const { data: churchData } = await supabase
        .from('church_tax_rates')
        .select('rate')
        .eq('state_code', input.churchTaxState)
        .single()
      
      if (churchData) {
        churchTaxRate = Number(churchData.rate)
      }
    }

    // Run calculation
    const result = await calculateInvestment(input, interestRates, taxParams, churchTaxRate)
    console.log('Calculation complete. Monthly burden:', result.summary.monthlyBurden)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Investment Engine Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
