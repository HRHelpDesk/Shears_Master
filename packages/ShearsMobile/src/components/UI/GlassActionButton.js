import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';


export const GlassActionButton = ({ icon, onPress, color, theme }) => {
  const buttonSize = 44;
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LiquidGlassView
        style={[
          styles.glassButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
          !isLiquidGlassSupported && {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
            borderColor: theme.colors.border,
          },
        ]}
        effect="clear"
        interactive
      >
        <IconButton
          icon={icon}
          size={20}
          iconColor={color || theme.colors.text}
          style={styles.iconButton}
        />
      </LiquidGlassView>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },
  headerContainer: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 16,
    alignItems: 'center',
  },
  glassButton: {
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    margin: 0,
  },
  fieldsContainer: {
    // Clean container for fields
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  arraySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  arrayItemCard: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
  },
  arrayItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrayItemContent: {
    // Nested content spacing
  },
  objectSection: {
    marginBottom: 16,
  },
  objectContent: {
    padding: 12,
    borderRadius: 8,
  },
});