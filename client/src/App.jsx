import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Filters from './components/Filters';
import MonthlyBarChart from './components/MonthlyBarChart';
import ChannelDoughnutChart from './components/ChannelDoughnutChart';
import RepPerformanceTable from './components/RepPerformanceTable';


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// =================================================================================
// Constants and Dummy Data
// =================================================================================
const DUMMY_DEALS = [
  { id: 1, channel: '直販', sales: 500000, profit: 150000, phase: '納品完了', orderMonth: new Date('2024-04-10'), deliveryMonth: new Date('2024-05-15'), salesRep: '佐藤 太郎' },
  { id: 2, channel: '代理店A', sales: 300000, profit: 90000, phase: '納品完了', orderMonth: new Date('2024-04-20'), deliveryMonth: new Date('2024-05-25'), salesRep: '鈴木 一郎' },
  { id: 3, channel: '代理店B', sales: 750000, profit: 225000, phase: '受注済み', orderMonth: new Date('2024-05-05'), deliveryMonth: new Date('2024-06-10'), salesRep: '高橋 花子' },
  { id: 4, channel: 'オンライン', sales: 120000, profit: 60000, phase: '実施確定', orderMonth: new Date('2024-05-15'), deliveryMonth: new Date('2024-05-20'), salesRep: '佐藤 太郎' },
  { id: 5, channel: '直販', sales: 900000, profit: 270000, phase: '納品完了', orderMonth: new Date('2024-06-01'), deliveryMonth: new Date('2024-07-05'), salesRep: '鈴木 一郎' },
  { id: 6, channel: '代理店A', sales: 450000, profit: 135000, phase: '失注', orderMonth: new Date('2024-06-10'), deliveryMonth: new Date('2024-07-15'), salesRep: '高橋 花子' },
  { id: 7, channel: '直販', sales: 600000, profit: 180000, phase: '納品完了', orderMonth: new Date('2024-07-22'), deliveryMonth: new Date('2024-08-30'), salesRep: '佐藤 太郎' },
  { id: 8, channel: 'オンライン', sales: 200000, profit: 100000, phase: '受注済み', orderMonth: new Date('2024-08-11'), deliveryMonth: new Date('2024-09-12'), salesRep: '高橋 花子' },
  { id: 9, channel: '代理店B', sales: 1200000, profit: 360000, phase: '納品完了', orderMonth: new Date('2024-09-03'), deliveryMonth: new Date('2024-10-09'), salesRep: '鈴木 一郎' },
  { id: 10, channel: '直販', sales: 350000, profit: 105000, phase: '実施確定', orderMonth: new Date('2024-10-18'), deliveryMonth: new Date('2024-11-22'), salesRep: '佐藤 太郎' },
  { id: 11, channel: '代理店A', sales: 800000, profit: 240000, phase: '納品完了', orderMonth: new Date('2024-11-25'), deliveryMonth: new Date('2024-12-28'), salesRep: '高橋 花子' },
  { id: 12, channel: 'オンライン', sales: 150000, profit: 75000, phase: '提案中', orderMonth: new Date('2024-12-05'), deliveryMonth: new Date('2025-01-10'), salesRep: '鈴木 一郎' },
  { id: 13, channel: '直販', sales: 550000, profit: 165000, phase: '納品完了', orderMonth: new Date('2025-01-15'), deliveryMonth: new Date('2025-02-18'), salesRep: '佐藤 太郎' },
  { id: 14, channel: '代理店B', sales: 950000, profit: 285000, phase: '受注済み', orderMonth: new Date('2025-02-20'), deliveryMonth: new Date('2025-03-25'), salesRep: '高橋 花子' },
  { id: 15, channel: '直販', sales: 400000, profit: 120000, phase: '納品完了', orderMonth: new Date('2023-08-10'), deliveryMonth: new Date('2023-09-15'), salesRep: '佐藤 太郎' },
  { id: 16, channel: '代理店A', sales: 650000, profit: 195000, phase: '実施確定', orderMonth: new Date('2023-11-01'), deliveryMonth: new Date('2023-12-05'), salesRep: '鈴木 一郎' },
  { id: 17, channel: 'オンライン', sales: 250000, profit: 125000, phase: '納品完了', orderMonth: new Date('2025-04-05'), deliveryMonth: new Date('2025-05-10'), salesRep: '佐藤 太郎' },
  { id: 18, channel: '直販', sales: 1100000, profit: 330000, phase: '受注済み', orderMonth: new Date('2025-05-10'), deliveryMonth: new Date('2025-06-15'), salesRep: '鈴木 一郎' },
];

const VALID_PHASES = ['納品完了', '受注済み', '実施確定'];
const FISCAL_YEAR_START_MONTH = 3; // April (0-indexed)
const MONTH_LABELS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
const FISCAL_YEARS_MAP = { 2023: 1, 2024: 2, 2025: 3 };

// =================================================================================
// Helper Functions (Data Processing Logic)
// =================================================================================
const getFiscalYearNumber = (date) => {
  if (!date) return null;
  return date.getMonth() >= FISCAL_YEAR_START_MONTH ? date.getFullYear() : date.getFullYear() - 1;
};

const aggregateMonthlyData = (deals, dateField) => {
  const monthlyTotals = new Array(12).fill(0).map(() => ({ sales: 0, profit: 0 }));
  deals.forEach(deal => {
    if (!deal[dateField]) return;
    const month = deal[dateField].getMonth();
    const fiscalMonthIndex = (month - FISCAL_YEAR_START_MONTH + 12) % 12;
    monthlyTotals[fiscalMonthIndex].sales += deal.sales;
    monthlyTotals[fiscalMonthIndex].profit += deal.profit;
  });
  return {
    labels: MONTH_LABELS,
    datasets: [
      { label: '売上高', data: monthlyTotals.map(m => m.sales), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
      { label: '粗利金額', data: monthlyTotals.map(m => m.profit), backgroundColor: 'rgba(22, 163, 74, 0.7)' },
    ],
  };
};

// =================================================================================
// UI Helper Components (Cardのみ残す)
// =================================================================================
const Card = ({ children, className = '', title, theme }) => (
  <div className={`rounded-lg shadow-lg p-6 ${className} ${
    theme === 'dark'
    ? 'bg-slate-800'
    : 'bg-white border border-gray-200/80'
  }`}>
    <h2 className={`text-xl font-bold mb-4 ${
      theme === 'dark' ? 'text-slate-100' : 'text-gray-900'
    }`}>{title}</h2>
    {children}
  </div>
);

// =================================================================================
// Main App Component
// =================================================================================
const App = () => {
  const [deals, setDeals] = useState(DUMMY_DEALS); // 実際のデータ連携のためsetDealsも用意
  const [theme, setTheme] = useState('dark');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(2);
  const [selectedSalesReps, setSelectedSalesReps] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'totalSales', direction: 'descending' });

  // ここにデータ取得ロジックを追加予定 (useEffect)

  const uniqueSalesReps = useMemo(() => Array.from(new Set(deals.map(d => d.salesRep))), [deals]);
  const uniqueChannels = useMemo(() => Array.from(new Set(deals.map(d => d.channel))), [deals]);
  
  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  
  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.remove('bg-slate-900');
      body.classList.add('bg-gray-50');
    } else {
      body.classList.remove('bg-gray-50');
      body.classList.add('bg-slate-900');
    }
  }, [theme]);

  const processedData = useMemo(() => {
    const targetFiscalYear = Object.keys(FISCAL_YEARS_MAP).find(key => FISCAL_YEARS_MAP[parseInt(key)] === selectedFiscalYear);

    const preFilteredDeals = deals.filter(deal => VALID_PHASES.includes(deal.phase));

    const filteredDeals = preFilteredDeals.filter(deal =>
      (!selectedSalesReps.length || selectedSalesReps.includes(deal.salesRep)) &&
      (!selectedChannels.length || selectedChannels.includes(deal.channel))
    );
    
    const orderDeals = filteredDeals.filter(d => getFiscalYearNumber(d.orderMonth) === parseInt(targetFiscalYear || '0'));
    const deliveryDeals = filteredDeals.filter(d => getFiscalYearNumber(d.deliveryMonth) === parseInt(targetFiscalYear || '0'));

    const orderChartData = aggregateMonthlyData(orderDeals, 'orderMonth');
    const deliveryChartData = aggregateMonthlyData(deliveryDeals, 'deliveryMonth');

    const channelDataMap = deliveryDeals.reduce((acc, deal) => {
      acc[deal.channel] = (acc[deal.channel] || 0) + deal.profit;
      return acc;
    }, {});

    const doughnutChartData = {
      labels: Object.keys(channelDataMap),
      datasets: [{
        data: Object.values(channelDataMap),
        backgroundColor: ['#4ade80', '#22d3ee', '#818cf8', '#f87171', '#fbbf24'],
        borderWidth: 2,
      }],
    };
    
    const repPerformanceMap = deliveryDeals.reduce((acc, deal) => {
      if (!acc[deal.salesRep]) {
        acc[deal.salesRep] = { dealCount: 0, totalSales: 0, totalProfit: 0 };
      }
      acc[deal.salesRep].dealCount++;
      acc[deal.salesRep].totalSales += deal.sales;
      acc[deal.salesRep].totalProfit += deal.profit;
      return acc;
    }, {});

    const repPerformanceData = Object.entries(repPerformanceMap).map(([salesRep, data]) => ({
      salesRep,
      ...data,
      avgSale: data.dealCount > 0 ? data.totalSales / data.dealCount : 0,
    }));
    
    return { orderChartData, deliveryChartData, doughnutChartData, repPerformanceData };
  }, [deals, selectedFiscalYear, selectedSalesReps, selectedChannels]);
  
  const sortedRepPerformanceData = useMemo(() => {
    let sortableItems = [...processedData.repPerformanceData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [processedData.repPerformanceData, sortConfig]);

  const handleSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${ theme === 'dark' ? 'text-slate-300' : 'text-gray-700' }`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className={`text-3xl font-bold ${ theme === 'dark' ? 'text-slate-100' : 'text-gray-900' }`}>営業ダッシュボード</h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-cyan-500 focus:ring-offset-slate-900'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-indigo-500 focus:ring-offset-gray-50'
            }`}
            aria-label="テーマを切り替える"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>
            )}
          </button>
        </header>

        <main className="flex flex-col gap-6">
          <Filters
            selectedFiscalYear={selectedFiscalYear}
            setSelectedFiscalYear={setSelectedFiscalYear}
            uniqueSalesReps={uniqueSalesReps}
            selectedSalesReps={selectedSalesReps}
            setSelectedSalesReps={setSelectedSalesReps}
            uniqueChannels={uniqueChannels}
            selectedChannels={selectedChannels}
            setSelectedChannels={setSelectedChannels}
            theme={theme}
          />
          
          <Card title="月別推移" theme={theme}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MonthlyBarChart data={processedData.orderChartData} title="受注月別推移" theme={theme} />
              <MonthlyBarChart data={processedData.deliveryChartData} title="納品月別推移" theme={theme} />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <Card title="構成比" theme={theme}>
                <ChannelDoughnutChart data={processedData.doughnutChartData} theme={theme} />
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card title="担当者別実績 (納品ベース)" theme={theme}>
                <RepPerformanceTable data={sortedRepPerformanceData} onSort={handleSort} sortConfig={sortConfig} theme={theme} />
              </Card>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;