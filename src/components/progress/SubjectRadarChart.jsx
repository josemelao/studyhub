import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { staggerItem } from '../../lib/animations';

export default function SubjectRadarChart({ data }) {
  const hasData = data && data.length >= 3;

  return (
    <motion.div variants={staggerItem} className="h-full w-full">
      {!hasData ? (
        <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
          <p className="text-sm">Dados insuficientes para gerar análise estratégica.</p>
          <p className="text-[10px] mt-1">(Mínimo 3 matérias estudadas)</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false}
              axisLine={false}
            />
            <Tooltip 
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
              formatter={(value) => [`${value}%`, 'Aproveitamento']}
            />
            <Radar
              name="Desempenho"
              dataKey="accuracy"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
