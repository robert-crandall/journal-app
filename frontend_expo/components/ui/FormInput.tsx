// Form input components
// Provides consistent form styling with validation support

import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  registration?: UseFormRegisterReturn;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const FormInput = forwardRef<TextInput, FormInputProps>(({
  label,
  error,
  helperText,
  required = false,
  registration,
  leftIcon,
  rightIcon,
  containerClassName = '',
  style,
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[styles.inputContainer, hasError && styles.inputContainerError]}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            hasError ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor="#9CA3AF"
          {...registration}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
});

FormInput.displayName = 'FormInput';

// Password input component
interface PasswordInputProps extends Omit<FormInputProps, 'secureTextEntry' | 'rightIcon'> {
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showPassword = false,
  onTogglePassword,
  ...props
}) => {
  return (
    <FormInput
      {...props}
      secureTextEntry={!showPassword}
      rightIcon={
        <button
          type="button"
          onClick={onTogglePassword}
          className="btn btn-ghost btn-sm"
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      }
    />
  );
};

// Textarea component
interface TextareaProps extends FormInputProps {
  rows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  rows = 4,
  style,
  ...props
}) => {
  return (
    <FormInput
      {...props}
      multiline
      numberOfLines={rows}
      style={[{ height: rows * 24 + 16 }, style]}
      textAlignVertical="top"
    />
  );
};

// Select component (for web mainly)
interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  required = false,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  containerClassName = '',
}) => {
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <select
        className={`select select-bordered w-full ${hasError ? 'select-error' : ''}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option disabled value="">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
