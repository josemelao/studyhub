import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function FavoriteButton({ tipo, referenciaId, initialIsFav = false }) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(initialIsFav);
  const [loading, setLoading] = useState(false);

  // Sincronizar estado inicial se necessário
  useEffect(() => {
    async function checkFav() {
      if (!user) return;
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .eq('referencia_id', referenciaId)
        .single();
      if (data) setIsFav(true);
    }
    checkFav();
  }, [user, tipo, referenciaId]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || !user) return;

    // Optimistic Update
    const previousState = isFav;
    setIsFav(!previousState);
    setLoading(true);

    try {
      if (previousState) {
        // Remover
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('tipo', tipo)
          .eq('referencia_id', referenciaId);
      } else {
        // Adicionar
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            tipo,
            referencia_id: referenciaId
          });
      }
    } catch (err) {
      console.error(err);
      setIsFav(previousState); // Reverter em caso de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={toggleFavorite}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      className={`p-2 rounded-xl border transition-all ${
        isFav 
          ? 'bg-accent/10 border-accent text-accent shadow-glow-accent' 
          : 'bg-secondary border-default text-muted hover:border-accent/30'
      }`}
    >
      <Star
        size={20}
        fill={isFav ? 'currentColor' : 'none'}
        className="transition-colors duration-300"
      />
    </motion.button>
  );
}
