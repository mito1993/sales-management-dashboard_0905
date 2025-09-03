import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';

const ChannelDoughnutChart = ({ data, theme }) => {
  const textColor = theme === 'dark' ? '#cbd5e1' : '#374151';
  const titleColor = theme === 'dark' ? '#f1f5f9' : '#111827';
  
  const themedData = useMemo(() => ({
      ...data,
      datasets: data.datasets.map(dataset => ({
        ...dataset,
        borderColor: theme === 'dark' ? '#1e293b' : '#ffffff'
      }))
  }), [data, theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: textColor } },
      title: { display: true, text: '商流別粗利構成比 (納品ベース)', color: titleColor, font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value)} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const hasData = data && data.datasets && data.datasets.some(ds => ds.data.length > 0 && ds.data.some(val => val > 0));

  return (
    <div className="h-80">
      {hasData ? <Doughnut data={themedData} options={options} /> : <p className="text-center h-full flex items-center justify-center">表示するデータがありません</p>}
    </div>
  );
};

export default ChannelDoughnutChart;