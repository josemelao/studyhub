import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { staggerItem } from '../../lib/animations';

export default function PerformanceEvolutionChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <motion.div variants={staggerItem} className="glass-card p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Evolução de Desempenho</h3>
          <p className="text-xs text-muted">Aproveitamento médio diário (%) em quizzes e simulados.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Sessões insuficientes para visualizar evolução.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, name]}
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
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}
              />
              <Line 
                name="Quizzes"
                type="monotone" 
                dataKey="quizScore" 
                stroke="var(--accent)" 
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--bg-main)' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls
              />
              <Line 
                name="Simulados"
                type="monotone" 
                dataKey="examScore" 
                stroke="var(--chart-2)" 
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--chart-2)', strokeWidth: 2, stroke: 'var(--bg-main)' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
