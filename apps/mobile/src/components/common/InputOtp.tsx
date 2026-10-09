import React, { forwardRef, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import { theme } from '../../styles';

interface OTPInputProps {
  value: string;
  length?: number;
  onChangeText: (value: string) => void;
  isDisabled?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export const InputOTP = forwardRef<TextInput, OTPInputProps>(
  (
    {
      value,
      length = 6,
      onChangeText,
      isDisabled = false,
      containerStyle,
      inputStyle,
    },
    ref
  ) => {
    const hiddenInputRef = useRef<TextInput | null>(null);

    const handleFocus = () => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    };

    const characters = value.padEnd(length, ' ').split('');

    return (
      <TouchableWithoutFeedback onPress={handleFocus}>
        <View
          style={[
            styles.container,
            isDisabled && styles.disabled,
            containerStyle,
          ]}
        >
          {characters.map((char, index) => (
            <InputOTPSlot
              key={index}
              char={char}
              isActive={index === value.length}
              style={inputStyle}
              onPress={handleFocus}
            />
          ))}

          <TextInput
            ref={(textInputRef) => {
              hiddenInputRef.current = textInputRef;
              if (ref && typeof ref === 'function') {
                ref(textInputRef);
              } else if (
                ref &&
                typeof ref === 'object' &&
                ref.current !== undefined
              ) {
                ref.current = textInputRef;
              }
            }}
            value={value}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9]/g, '');
              onChangeText(numericText);
            }}
            maxLength={length}
            keyboardType="numeric"
            style={styles.hiddenInput}
            editable={!isDisabled}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }
);

InputOTP.displayName = 'InputOTP';

interface OTPInputSlotProps {
  char: string;
  isActive: boolean;
  style?: ViewStyle;
  onPress: () => void;
}

const InputOTPSlot: React.FC<OTPInputSlotProps> = ({
  char,
  isActive,
  style,
  onPress,
}) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.slot, isActive && styles.activeSlot, style]}>
        <Text style={styles.char}>{char.trim()}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

InputOTPSlot.displayName = 'InputOTPSlot';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  slot: {
    height: 52,
    width: 46,
    borderWidth: 1.5,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  activeSlot: {
    borderColor: theme.colors.brandOrange,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceCard,
  },
  char: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    height: 1,
    width: 1,
  },
});

export default InputOTP;
