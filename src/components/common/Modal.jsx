import { useEffect, useRef } from 'react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  closeOnEscape = true,
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (closeOnEscape && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Restore body scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle overlay click
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      {...props}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl overflow-hidden w-full ${sizeClasses[size] || sizeClasses.md} ${className}`}
      >
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-4">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Modal with confirmation buttons
Modal.Confirm = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isConfirmLoading = false,
  isDanger = false,
  size = 'md',
  ...props
}) => {
  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
      >
        {cancelText}
      </Button>
      <Button
        variant={isDanger ? 'danger' : confirmVariant}
        onClick={onConfirm}
        isLoading={isConfirmLoading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size={size}
      {...props}
    >
      {children}
    </Modal>
  );
};

// Modal for displaying alerts/notifications
Modal.Alert = ({
  isOpen,
  onClose,
  title,
  children,
  buttonText = 'OK',
  variant = 'primary',
  size = 'sm',
  ...props
}) => {
  const footer = (
    <Button
      variant={variant}
      onClick={onClose}
    >
      {buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size={size}
      {...props}
    >
      {children}
    </Modal>
  );
};

// Modal with form
Modal.Form = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitVariant = 'primary',
  isSubmitting = false,
  size = 'md',
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        type="button"
      >
        {cancelText}
      </Button>
      <Button
        variant={submitVariant}
        type="submit"
        isLoading={isSubmitting}
        form="modal-form" // Connect to form id
      >
        {submitText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size={size}
      {...props}
    >
      <form id="modal-form" onSubmit={handleSubmit}>
        {children}
      </form>
    </Modal>
  );
};

export default Modal;