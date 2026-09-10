import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import html2pdf from 'html2pdf.js';
import AgentPerformanceTable from './AgentPerformanceTable';

export default function AnalyticsDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const [data, setData] = useState<any>(null);
  
  // Date Range State
  const [datePreset, setDatePreset] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session || !activeTenant) return;
      
      let start = new Date();
      let end = new Date();

      if (datePreset === '7d') {
        start.setDate(start.getDate() - 7);
      } else if (datePreset === '30d') {
        start.setDate(start.getDate() - 30);
      } else if (datePreset === '90d') {
        start.setDate(start.getDate() - 90);
      } else if (datePreset === 'custom' && customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/analytics?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const json = await response.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalytics();
  }, [session, activeTenant, datePreset, customStart, customEnd]);

  const handleExportCSV = () => {
    if (!data) return;
    
    // Create CSV content
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Contacts', data.metrics.totalContacts],
      ['Messages Processed', data.metrics.totalMessages],
      ['Active Campaigns', data.metrics.activeCampaigns],
    ];
    
    // Add Volume Data
    rows.push(['---', '---']);
    rows.push(['Date', 'Message Volume']);
    data.volumeData.forEach((vd: any) => {
      rows.push([vd.date, vd.messages]);
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    const element = document.getElementById('analytics-dashboard-content');
    if (element) {
      const opt = {
        margin:       0.5,
        filename:     `analytics_report_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' as const }
      };
      
      html2pdf().set(opt).from(element).save();
    }
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  const COLORS = ['#25D366', '#E1306C', '#1877F2']; // WhatsApp, IG, FB colors

  return (
    <div className="max-w-6xl mx-auto space-y-8 print:m-0 print:max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-gray-500">Your high-level performance metrics across all channels.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button onClick={() => setDatePreset('7d')} className={`px-3 py-1 text-sm font-medium rounded-md ${datePreset === '7d' ? 'bg-white shadow' : 'text-gray-500'}`}>7D</button>
            <button onClick={() => setDatePreset('30d')} className={`px-3 py-1 text-sm font-medium rounded-md ${datePreset === '30d' ? 'bg-white shadow' : 'text-gray-500'}`}>30D</button>
            <button onClick={() => setDatePreset('90d')} className={`px-3 py-1 text-sm font-medium rounded-md ${datePreset === '90d' ? 'bg-white shadow' : 'text-gray-500'}`}>90D</button>
            <button onClick={() => setDatePreset('custom')} className={`px-3 py-1 text-sm font-medium rounded-md ${datePreset === 'custom' ? 'bg-white shadow' : 'text-gray-500'}`}>Custom</button>
          </div>
          
          {datePreset === 'custom' && (
            <div className="flex gap-2 items-center">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <span className="text-gray-400">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="bg-white border text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50">
              CSV
            </button>
            <button onClick={handlePrintPDF} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90">
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div id="analytics-dashboard-content" className="space-y-8 bg-gray-50/50 p-4 rounded-xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border p-6 rounded-xl shadow-sm print:shadow-none">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Contacts</p>
          <p className="text-3xl font-bold">{data.metrics.totalContacts.toLocaleString()}</p>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm print:shadow-none">
          <p className="text-sm font-medium text-gray-500 mb-1">Messages Processed</p>
          <p className="text-3xl font-bold">{data.metrics.totalMessages.toLocaleString()}</p>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm print:shadow-none">
          <p className="text-sm font-medium text-gray-500 mb-1">Active Campaigns</p>
          <p className="text-3xl font-bold">{data.metrics.activeCampaigns.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white border p-6 rounded-xl shadow-sm print:shadow-none print:mb-6">
          <h2 className="text-lg font-semibold mb-6">Message Volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="messages" stroke="#000000" strokeWidth={3} dot={{r: 4, fill: '#000000'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1 bg-white border p-6 rounded-xl shadow-sm print:shadow-none print:break-before-page">
          <h2 className="text-lg font-semibold mb-6">Channel Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.channelData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm font-medium text-gray-600">
            {data.channelData.map((_entry: any, index: number) => (
              <div key={_entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                {_entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <AgentPerformanceTable 
        datePreset={datePreset}
        customStart={customStart}
        customEnd={customEnd}
      />
      
      </div>
    </div>
  );
}
