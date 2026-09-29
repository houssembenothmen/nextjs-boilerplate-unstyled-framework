import { loginAction } from './actions'
import { Form, FormField, FormLabel, Input, Button } from '@/components/ui'

export default function LoginPage() {
  return (
    <main data-page data-narrow>
      <h1>Log in</h1>
      <Form action={loginAction} data-stack>
        <FormField name="email" required>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" autoComplete="email" required />
        </FormField>
        <FormField name="password" required>
          <FormLabel>Password</FormLabel>
          <Input type="password" name="password" autoComplete="current-password" required />
        </FormField>
        <Button type="submit">Log in</Button>
      </Form>
    </main>
  )
}
