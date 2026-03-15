import { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { theme, labelStyles, inputStyles } from '../styles/theme';

interface FormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  style?: CSSProperties;
}

export function FormLabel({ children, htmlFor, required, style }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        ...labelStyles.base,
        ...style
      }}
    >
      {children}
      {required && <span style={{ color: theme.colors.error, marginLeft: '4px' }}>*</span>}
    </label>
  );
}

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  fullWidth?: boolean;
}

export function FormInput({ error, fullWidth = true, style, ...props }: FormInputProps) {
  return (
    <div style={{ marginBottom: theme.spacing.lg, width: fullWidth ? '100%' : 'auto' }}>
      <input
        style={{
          ...inputStyles.base,
          ...(error ? inputStyles.error : {}),
          ...style
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.colors.primary;
          e.target.style.boxShadow = `0 0 0 3px ${error ? theme.colors.errorLight : theme.colors.primaryLight}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.colors.border.default;
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <div style={{
          color: theme.colors.error,
          fontSize: theme.typography.fontSize.xs,
          marginTop: theme.spacing.xs
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  fullWidth?: boolean;
}

export function FormTextarea({ error, fullWidth = true, style, ...props }: FormTextareaProps) {
  return (
    <div style={{ marginBottom: theme.spacing.lg, width: fullWidth ? '100%' : 'auto' }}>
      <textarea
        style={{
          ...inputStyles.base,
          ...(error ? inputStyles.error : {}),
          minHeight: '100px',
          resize: 'vertical',
          fontFamily: theme.typography.fontFamily,
          ...style
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.colors.primary;
          e.target.style.boxShadow = `0 0 0 3px ${error ? theme.colors.errorLight : theme.colors.primaryLight}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.colors.border.default;
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <div style={{
          color: theme.colors.error,
          fontSize: theme.typography.fontSize.xs,
          marginTop: theme.spacing.xs
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  error?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

export function FormSelect({ error, fullWidth = true, style, children, ...props }: FormSelectProps) {
  return (
    <div style={{ marginBottom: theme.spacing.lg, width: fullWidth ? '100%' : 'auto' }}>
      <select
        style={{
          ...inputStyles.base,
          ...(error ? inputStyles.error : {}),
          cursor: 'pointer',
          ...style
        }}
        onFocus={(e: any) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.colors.primary;
          e.target.style.boxShadow = `0 0 0 3px ${error ? theme.colors.errorLight : theme.colors.primaryLight}`;
        }}
        onBlur={(e: any) => {
          e.target.style.borderColor = error ? theme.colors.error : theme.colors.border.default;
          e.target.style.boxShadow = 'none';
        }}
        {...props as any}
      >
        {children}
      </select>
      {error && (
        <div style={{
          color: theme.colors.error,
          fontSize: theme.typography.fontSize.xs,
          marginTop: theme.spacing.xs
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

interface FormGroupProps {
  children: ReactNode;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  style?: CSSProperties;
}

export function FormGroup({ children, label, htmlFor, required, error, style }: FormGroupProps) {
  return (
    <div style={{ marginBottom: theme.spacing.lg, ...style }}>
      {label && (
        <FormLabel htmlFor={htmlFor} required={required}>
          {label}
        </FormLabel>
      )}
      {children}
      {error && (
        <div style={{
          color: theme.colors.error,
          fontSize: theme.typography.fontSize.xs,
          marginTop: theme.spacing.xs
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
