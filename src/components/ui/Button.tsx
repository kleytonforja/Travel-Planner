import type { ButtonHTMLAttributes } from 'react'

import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
  type ButtonWidth,
} from './variants'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  width?: ButtonWidth
}

/** Botão do Design System. O tipo padrão é "button" (nunca envia formulários por acidente). */
export function Button({
  variant,
  size,
  width,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = buttonClasses({ variant, size, width })
  return (
    <button
      type={type}
      className={className ? `${classes} ${className}` : classes}
      {...rest}
    />
  )
}
