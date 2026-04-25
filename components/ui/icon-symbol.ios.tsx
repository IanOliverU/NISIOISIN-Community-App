import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

const MAPPING = {
  'house.fill': 'house.fill',
  'paperplane.fill': 'paperplane.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.forwardslash.chevron.right',
  'chevron.right': 'chevron.right',
  'library.fill': 'books.vertical.fill',
  'history': 'clock.arrow.circlepath',
  'gearshape.fill': 'gearshape.fill',
  'checkmark': 'checkmark',
  'book.closed.fill': 'book.closed.fill',
  'chevron.left': 'chevron.left',
  'arrow.up.right.square': 'arrow.up.right.square',
  'arrow.up.left.and.arrow.down.right': 'arrow.up.left.and.arrow.down.right',
  'arrow.down.right.and.arrow.up.left': 'arrow.down.right.and.arrow.up.left',
} as const satisfies Record<string, SymbolViewProps['name']>;

type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={MAPPING[name]}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
