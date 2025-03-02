import { forwardRef } from 'react';

const Input = forwardRef(({
  type = 'text',
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helper,
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  startIcon,
  endIcon,
  ...props
}, ref) => {
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 focus:ring-primary focus:border-primary';

  const disabledClasses = disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
    : 'bg-white';

  const iconClasses = startIcon 
    ? 'pl-10' 
    : endIcon 
      ? 'pr-10' 
      : '';

  const baseClasses = 'block w-full px-4 py-2 rounded-md shadow-sm transition-colors border focus:outline-none focus:ring-2';
  
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={id} 
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName} ${required ? 'required' : ''}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}
        
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseClasses} ${errorClasses} ${disabledClasses} ${iconClasses} ${inputClassName}`}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseClasses} ${errorClasses} ${disabledClasses} ${iconClasses} ${inputClassName}`}
            {...props}
          />
        )}
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Factory functions for common input types
Input.Text = forwardRef((props, ref) => (
  <Input ref={ref} type="text" {...props} />
));
Input.Text.displayName = 'Input.Text';

Input.Email = forwardRef((props, ref) => (
  <Input ref={ref} type="email" {...props} />
));
Input.Email.displayName = 'Input.Email';

Input.Password = forwardRef((props, ref) => (
  <Input ref={ref} type="password" {...props} />
));
Input.Password.displayName = 'Input.Password';

Input.Number = forwardRef((props, ref) => (
  <Input ref={ref} type="number" {...props} />
));
Input.Number.displayName = 'Input.Number';

Input.Textarea = forwardRef((props, ref) => (
  <Input ref={ref} type="textarea" {...props} />
));
Input.Textarea.displayName = 'Input.Textarea';

Input.Select = forwardRef(({ children, ...props }, ref) => (
  <Input.Wrapper
    label={props.label}
    error={props.error}
    helper={props.helper}
    required={props.required}
    containerClassName={props.containerClassName}
    labelClassName={props.labelClassName}
  >
    <select
      ref={ref}
      id={props.id}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      required={props.required}
      className={`block w-full px-4 py-2 rounded-md shadow-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
        props.error 
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
          : 'border-gray-300'
      } ${
        props.disabled 
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
          : 'bg-white'
      } ${props.className || ''}`}
      {...props}
    >
      {children}
    </select>
  </Input.Wrapper>
));
Input.Select.displayName = 'Input.Select';

// Wrapper component for form inputs
Input.Wrapper = ({
  label,
  id,
  error,
  helper,
  required,
  children,
  containerClassName = '',
  labelClassName = '',
}) => (
  <div className={`mb-4 ${containerClassName}`}>
    {label && (
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName} ${required ? 'required' : ''}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    
    {children}
    
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
    
    {helper && !error && (
      <p className="mt-1 text-sm text-gray-500">{helper}</p>
    )}
  </div>
);

// Form file input
Input.File = forwardRef(({
  label,
  id,
  name,
  accept,
  required = false,
  disabled = false,
  error,
  helper,
  containerClassName = '',
  labelClassName = '',
  className = '',
  onChange,
  ...props
}, ref) => (
  <Input.Wrapper
    label={label}
    id={id}
    error={error}
    helper={helper}
    required={required}
    containerClassName={containerClassName}
    labelClassName={labelClassName}
  >
    <div className="flex items-center">
      <input
        ref={ref}
        type="file"
        id={id}
        name={name}
        accept={accept}
        disabled={disabled}
        required={required}
        className={`hidden ${className}`}
        onChange={onChange}
        {...props}
      />
      <label
        htmlFor={id}
        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <i className="ri-upload-line mr-2"></i>
        Browse
      </label>
      <span className="ml-3 text-sm text-gray-500" id={`${id}-filename`}>
        {props.value ? props.value.name : 'No file selected'}
      </span>
    </div>
  </Input.Wrapper>
));
Input.File.displayName = 'Input.File';

// Checkbox input
Input.Checkbox = forwardRef(({
  label,
  id,
  name,
  checked,
  onChange,
  required = false,
  disabled = false,
  error,
  helper,
  containerClassName = '',
  labelClassName = '',
  className = '',
  ...props
}, ref) => (
  <div className={`mb-4 ${containerClassName}`}>
    <div className="flex items-center">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        {...props}
      />
      <label 
        htmlFor={id} 
        className={`ml-2 block text-sm text-gray-700 ${labelClassName} ${disabled ? 'opacity-50' : ''}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
    
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
    
    {helper && !error && (
      <p className="mt-1 text-sm text-gray-500">{helper}</p>
    )}
  </div>
));
Input.Checkbox.displayName = 'Input.Checkbox';

// Radio input
Input.Radio = forwardRef(({
  label,
  id,
  name,
  value,
  checked,
  onChange,
  required = false,
  disabled = false,
  error,
  helper,
  containerClassName = '',
  labelClassName = '',
  className = '',
  ...props
}, ref) => (
  <div className={`mb-4 ${containerClassName}`}>
    <div className="flex items-center">
      <input
        ref={ref}
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        {...props}
      />
      <label 
        htmlFor={id} 
        className={`ml-2 block text-sm text-gray-700 ${labelClassName} ${disabled ? 'opacity-50' : ''}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
    
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
    
    {helper && !error && (
      <p className="mt-1 text-sm text-gray-500">{helper}</p>
    )}
  </div>
));
Input.Radio.displayName = 'Input.Radio';

// Radio group
Input.RadioGroup = ({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  helper,
  containerClassName = '',
  labelClassName = '',
  radioContainerClassName = '',
  ...props
}) => (
  <div className={`mb-4 ${containerClassName}`}>
    {label && (
      <div className={`block text-sm font-medium text-gray-700 mb-2 ${labelClassName}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>
    )}
    
    <div className={`space-y-2 ${radioContainerClassName}`}>
      {options.map((option) => (
        <Input.Radio
          key={option.value}
          id={`${name}-${option.value}`}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
          label={option.label}
          disabled={disabled || option.disabled}
          containerClassName="mb-0"
          {...props}
        />
      ))}
    </div>
    
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
    
    {helper && !error && (
      <p className="mt-1 text-sm text-gray-500">{helper}</p>
    )}
  </div>
);

export default Input;