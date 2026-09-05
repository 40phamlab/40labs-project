import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  PasswordInput,
  Checkbox,
  Field,
  FieldLabel,
  Select,
} from '../index';

export type FieldType = 'text' | 'password' | 'email' | 'tel' | 'otp' | 'checkbox' | 'select';

export interface FieldConfig {
  id: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  otpAction?: { label: string; onSend: () => void };
}

export interface ActionConfig {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost' | 'accent';
}

export interface FormSchema {
  id: string;
  title: string;
  subtitle?: string;
  fields: FieldConfig[];
  submitLabel: string;
  secondaryActions?: ActionConfig[];
  footerLink?: { label: string; onClick: () => void };
  branding?: { showLogoBadge: boolean };
}

export interface AuthFormCardProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}

export function AuthFormCard({ schema, onSubmit, isLoading }: AuthFormCardProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const handleInputChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case 'password':
        return (
          <PasswordInput
            placeholder={field.placeholder}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            label={field.label}
            onChange={(e) => handleInputChange(field.id, e.target.checked)}
          />
        );
      case 'select':
        return (
          <Select onChange={(e) => handleInputChange(field.id, e.target.value)}>
            <option value="">{field.placeholder || 'Select option...'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        );
      case 'otp':
        return (
          <div className="flex gap-2">
            <Input
              placeholder={field.placeholder || 'Enter code'}
              className="flex-1"
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {field.otpAction && (
              <Button
                variant="secondary"
                size="md"
                onClick={field.otpAction.onSend}
                className="whitespace-nowrap px-4"
              >
                {field.otpAction.label}
              </Button>
            )}
          </div>
        );
      default:
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-surface-pop">
      <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-6 border-none text-center">
        {schema.branding?.showLogoBadge && (
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2 elevation-raised">
            <div className="w-6 h-6 rounded-full bg-surface/20 animate-pulse" />
          </div>
        )}
        <h2 className="text-xl font-heading font-bold text-text leading-tight">
          {schema.title}
        </h2>
        {schema.subtitle && (
          <p className="text-sm text-text-muted">{schema.subtitle}</p>
        )}
      </CardHeader>
      <CardBody className="space-y-4 px-8 pb-8">
        {schema.fields.map((field) => (
          <Field key={field.id}>
            {field.type !== 'checkbox' && field.label && (
              <FieldLabel>{field.label}</FieldLabel>
            )}
            {renderField(field)}
          </Field>
        ))}

        <div className="pt-4 flex flex-col gap-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={isLoading}
            onClick={() => onSubmit(formData)}
            className="font-bold tracking-wide"
          >
            {schema.submitLabel}
          </Button>
          {schema.secondaryActions?.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'ghost'}
              fullWidth
              size="md"
              onClick={action.onClick}
              className={
                !action.variant || action.variant === 'ghost'
                  ? 'text-text-muted hover:text-text'
                  : ''
              }
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardBody>
      {schema.footerLink && (
        <CardFooter className="flex justify-center py-6 border-none bg-transparent pt-0">
          <button
            onClick={schema.footerLink.onClick}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-all hover:underline underline-offset-4"
          >
            {schema.footerLink.label}
          </button>
        </CardFooter>
      )}
    </Card>
  );
}
