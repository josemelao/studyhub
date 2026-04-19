import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { staggerItem } from '../../lib/animations';
import { useContainerSize } from '../../hooks/useContainerSize';

export default function PracticeVolumeChart({ data, volumeMode, setVolumeMode }) {
  const hasData = data && data.length > 0;
  const { ref, ready } = useContainerSize();

  return (
    <motion.div variants={staggerItem} className="glass-card p-6 h-[350px] flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Volume de Prática</h3>
          <p className="text-xs text-muted">Intensidade de resolução de questões.</p>
        </div>

        <div className="flex bg-bg-main/50 backdrop-blur-sm border border-white/5 p-1 rounded-xl">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'quiz', label: 'Prática' },
            { id: 'exam', label: 'Simulados' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setVolumeMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                volumeMode === m.id 
                ? 'bg-accent text-white shadow-lg' 
                : 'text-muted hover:text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="flex-1 min-h-0 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Sem dados de prática para o período.</p>
          </div>
        ) : ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                formatter={(value) => [`${value} Questões`, 'Volume']}
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
                dataKey="count" 
                radius={[4, 4, 0, 0]}
                fill="var(--accent)"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </motion.div>
  );
}
