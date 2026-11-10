import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context.ts";
import { AuthLayout } from "../components/AuthLayout.tsx";
import { Button } from "../components/Button.tsx";
import { FormAlert } from "../components/FormAlert.tsx";
import { PasswordChecklist } from "../components/PasswordChecklist.tsx";
import { PasswordField } from "../components/PasswordField.tsx";
import { TextField } from "../components/TextField.tsx";
import { applyServerError } from "../lib/apply-server-error.ts";
import { signUpSchema, type SignUpInput, type SignUpValues } from "../lib/auth-schemas.ts";

const FIELDS = ["email", "name", "password"] as const;

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: { email: "", name: "", password: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values);
      navigate("/", { replace: true });
    } catch (error) {
      applyServerError(error, FIELDS, setError);
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/sign-in" className="font-bold text-primary underline-offset-4 hover:underline">
            Sign in
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
        <TextField
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          description={<PasswordChecklist password={password} />}
          {...register("password")}
        />
        <Button type="submit" pending={isSubmitting} pendingLabel="Creating account…" className="mt-2">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
