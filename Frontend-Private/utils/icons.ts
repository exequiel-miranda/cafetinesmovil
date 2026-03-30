/**
 * Mapea nombres comunes de iconos (como 'cafe' o 'ice-cream') 
 * a nombres válidos de MaterialIcons (Material Design Icons).
 */
export const getMaterialIcon = (name: string): any => {
  if (!name) return 'help-outline';
  
  const map: Record<string, string> = {
    'cafe': 'local-cafe',
    'ice-cream': 'icecream',
    'fast-food': 'fastfood',
    'pizza': 'local-pizza',
    'drink': 'local-drink',
    'food': 'restaurant',
    'burger': 'lunch-dining',
    'cake': 'cake',
    'candy': 'bakery-dining',
    'cookie': 'cookie',
    'sandwich': 'lunch-dining',
    'soda': 'local-drink',
    'water': 'local-drink'
  };

  return (map[name.toLowerCase()] || name) as any;
};
