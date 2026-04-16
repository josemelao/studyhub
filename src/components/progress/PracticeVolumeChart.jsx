import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { staggerItem } from '../../lib/animations';

export default function PracticeVolumeChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <motion.div variants={staggerItem} className="glass-card p-6 h-[350px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Volume de Prática</h3>
        <p className="text-xs text-muted">Intensidade de resolução de questões.</p>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Sem dados de prática para o período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ 
                  backgroundColor: 'var(--secondary)', 
                  border: '1px solid var(--border-default)', 
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
                fill="var(--blue-500)"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="var(--blue-500)" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
