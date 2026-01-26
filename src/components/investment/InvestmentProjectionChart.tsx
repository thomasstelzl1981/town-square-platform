import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { YearlyData } from '@/hooks/useInvestmentEngine';

interface Props {
  projection: YearlyData[];
}

export function InvestmentProjectionChart({ projection }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Filter to show 10-year intervals for cleaner display
  const chartData = projection.filter((_, i) => i % 5 === 0 || i === projection.length - 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>40-Jahres-Projektion</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wealth">
          <TabsList className="mb-4">
            <TabsTrigger value="wealth">Vermögensentwicklung</TabsTrigger>
            <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
            <TabsTrigger value="debt">Darlehen</TabsTrigger>
          </TabsList>

          <TabsContent value="wealth">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickFormatter={(v) => `Jahr ${v}`} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Jahr ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="propertyValue" 
                    name="Immobilienwert" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="netWealth" 
                    name="Nettovermögen" 
                    stroke="hsl(142, 76%, 36%)" 
                    fill="hsl(142, 76%, 36%)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="cashflow">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickFormatter={(v) => `Jahr ${v}`} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Jahr ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rent" 
                    name="Mieteinnahmen" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="interest" 
                    name="Zinsen" 
                    stroke="hsl(0, 84%, 60%)" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cashFlowAfterTax" 
                    name="Cashflow n. Steuern" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="debt">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickFormatter={(v) => `Jahr ${v}`} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Jahr ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="remainingDebt" 
                    name="Restschuld" 
                    stroke="hsl(0, 84%, 60%)" 
                    fill="hsl(0, 84%, 60%)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Data Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Jahr</th>
                <th className="text-right py-2 px-2">Miete</th>
                <th className="text-right py-2 px-2">Zinsen</th>
                <th className="text-right py-2 px-2">Tilgung</th>
                <th className="text-right py-2 px-2">Restschuld</th>
                <th className="text-right py-2 px-2">Steuerersparnis</th>
                <th className="text-right py-2 px-2">Cashflow</th>
                <th className="text-right py-2 px-2">Nettovermögen</th>
              </tr>
            </thead>
            <tbody>
              {projection.filter((_, i) => i < 10 || i % 5 === 4).map((row) => (
                <tr key={row.year} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2">{row.year}</td>
                  <td className="text-right py-2 px-2 text-green-600">{formatCurrency(row.rent)}</td>
                  <td className="text-right py-2 px-2 text-red-600">{formatCurrency(row.interest)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(row.repayment)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(row.remainingDebt)}</td>
                  <td className="text-right py-2 px-2 text-green-600">{formatCurrency(row.taxSavings)}</td>
                  <td className={`text-right py-2 px-2 font-medium ${row.cashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(row.cashFlowAfterTax)}
                  </td>
                  <td className="text-right py-2 px-2 font-medium">{formatCurrency(row.netWealth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
