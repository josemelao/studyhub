import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { LayoutGrid, Radar as RadarIcon } from 'lucide-react';
import { staggerItem } from '../../lib/animations';
import { useContainerSize } from '../../hooks/useContainerSize';
import SubjectRadarChart from './SubjectRadarChart';

export default function SubjectAccuracyChart({ data, viewMode, setViewMode }) {
  const hasData = data && data.length > 0;
  const { ref, ready } = useContainerSize();

  return (
    <motion.div variants={staggerItem} className="glass-card p-6 h-[400px] flex flex-col relative overflow-hidden">
      {/* Header with Toggle */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Aproveitamento por Matéria</h3>
          <p className="text-xs text-muted">
            {viewMode === 'bar' 
              ? 'Média de acertos em cada disciplina estudada.' 
              : 'Equilíbrio estratégico do seu conhecimento.'}
          </p>
        </div>

        <div className="flex bg-bg-main/50 backdrop-blur-sm border border-white/5 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('bar')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'bar' 
                ? 'bg-accent text-white shadow-lg' 
                : 'text-muted hover:text-primary'
            }`}
            title="Visualização em Barras"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'radar' 
                ? 'bg-accent text-white shadow-lg' 
                : 'text-muted hover:text-primary'
            }`}
            title="Visualização em Radar"
          >
            <RadarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={ref} className="flex-1 min-h-0 w-full">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Ainda não há dados suficientes por matéria.</p>
          </div>
        ) : viewMode === 'radar' ? (
          <SubjectRadarChart data={data} />
        ) : ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
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
                formatter={(value) => [`${value}%`, 'Precisão']}
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
                dataKey="accuracy" 
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || 'var(--accent)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </motion.div>
  );
}
