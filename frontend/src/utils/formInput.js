/** Fields that must NOT be uppercased (passwords + security answer). */
const EXCLUDED_FIELDS = new Set([
  'password',
  'confirmPassword',
  'userPassword',
  'newPassword',
  'oldPassword',
  'currentPassword',
  'securityQuestionAnswer',
])

const SKIP_TYPES = new Set([
  'password',
  'number',
  'date',
  'datetime-local',
  'file',
  'hidden',
  'checkbox',
  'radio',
  'select-one',
  'email'
])

/**
 * Uppercase user-typed form values — used across all forms.
 * Excludes passwords and security-question answers.
 */
export function normalizeInputValue(name, value, type = 'text') {
  if (typeof value !== 'string') return value
  if (SKIP_TYPES.has(type)) return value
  if (EXCLUDED_FIELDS.has(name)) return value
  return value.toUpperCase()
}

/** Extract normalized value from a change/input event. */
export function normalizedEventValue(e) {
  const { name, value, type } = e.target
  return normalizeInputValue(name, value, type)
}
