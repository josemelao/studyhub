import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { staggerItem } from '../../lib/animations';

export default function ExamPerformanceChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <motion.div variants={staggerItem} className="glass-card p-6 h-[350px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Desempenho em Simulados</h3>
        <p className="text-xs text-muted">Aproveitamento específico no Modo Prova.</p>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Nenhum simulado finalizado recentemente.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="id" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                dy={10}
                tickFormatter={(id) => {
                  const entry = data.find(d => d.id === id);
                  return entry ? entry.date : id;
                }}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                labelFormatter={(id) => {
                  const entry = data.find(d => d.id === id);
                  return entry ? `${entry.name} (${entry.date})` : id;
                }}
                formatter={(value) => [`${value}%`, 'Resultado']}
                contentStyle={{ 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  opacity: 1,
                  padding: '8px 12px'
                }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '4px' }}
                itemStyle={{ color: 'var(--text-secondary)', padding: 0 }}
              />
              <Bar 
                dataKey="score" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.score >= 70 ? 'var(--success)' : entry.score >= 50 ? 'var(--accent)' : 'var(--error)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
