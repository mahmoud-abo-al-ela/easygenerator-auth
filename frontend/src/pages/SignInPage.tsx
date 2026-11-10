import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context.ts";
import { AuthLayout } from "../components/AuthLayout.tsx";
import { Button } from "../components/Button.tsx";
import { FormAlert } from "../components/FormAlert.tsx";
import { PasswordField } from "../components/PasswordField.tsx";
import { TextField } from "../components/TextField.tsx";
import { applyServerError } from "../lib/apply-server-error.ts";
import { signInSchema, type SignInInput, type SignInValues } from "../lib/auth-schemas.ts";

const FIELDS = ["email", "password"] as const;

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput, unknown, SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      navigate("/", { replace: true });
    } catch (error) {
      applyServerError(error, FIELDS, setError);
    }
  });

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          New here?{" "}
          <Link to="/sign-up" className="font-bold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <FormAlert message={errors.root?.server?.message} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" pending={isSubmitting} pendingLabel="Signing in…" className="mt-2">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
