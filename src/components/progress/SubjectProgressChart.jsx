import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { staggerItem } from '../../lib/animations';

export default function SubjectProgressChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <motion.div variants={staggerItem} className="glass-card p-6 h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Progresso no Edital</h3>
        <p className="text-xs text-muted">Avanço em tópicos por matéria.</p>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Ainda não há progresso registrado.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
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
                formatter={(value, name, props) => [`${value}% (${props.payload.topicsDone}/${props.payload.topicsTotal})`, 'Progresso']}
              />
              <Bar 
                dataKey="progress" 
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="var(--success)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
