"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface LoginForm {
    email: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const { setAuth, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Wait for hydration then redirect if already authenticated
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (isHydrated && isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isHydrated, isAuthenticated, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const response = await authApi.login(data.email, data.password);
            setAuth(response.user, response.accessToken, response.refreshToken);
            toast.success("Login successful!");
            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking auth state
    if (isHydrated && isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Panel: Branding (Hidden on mobile) */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary lg:flex">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div
                        className="h-full w-full bg-cover bg-center opacity-40 mix-blend-overlay"
                        style={{
                            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDQl3gAJRX8qNoJFtrU2LG9r9ZuZiHvTNqXP75WwaBU4-E0mxYYPZT6t6MmtjJSpyfhJdA4z1p8KT5mv7l6WSZLez8SALdZuxdG3P0qYgOYxFd017ZPvLSgqf0-2vHw1BpVrSyTlZSDJQRS_Vi77r2O6-fQkEhfpACXwhgKX1UAwGMstzEHXuZFIlSQaLlypYeUim8huu70CBk2D2quvTN9UrvXg0L66ag_NsprKFomO7_AtWNeAWoTx_3JrSqXUXURSqp0J0zazvM')`,
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/90"></div>
                </div>

                {/* Header Content */}
                <div className="relative z-10 flex items-center gap-3 px-12 py-10">
                    <div className="flex items-center justify-center rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                                fill="currentColor"
                            ></path>
                            <path
                                clipRule="evenodd"
                                d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z"
                                fill="currentColor"
                                fillRule="evenodd"
                            ></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-white">NyankoMatch CRM</h2>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
                    <h1 className="mb-6 max-w-lg text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl">Connecting Global Operations</h1>
                    <p className="max-w-md text-lg font-normal leading-relaxed text-blue-100">Secure access to the NyankoMatch ecosystem. Manage relationships across borders with enterprise-grade security and real-time data insights.</p>
                </div>

                {/* Footer Quote */}
                <div className="relative z-10 px-12 py-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                            <img
                                className="h-full w-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGTa2_gPcRqh3OJkF9u29cZbprlsdPymCve0KgJ7c3vXcwRtX6KXQ8uFeeyPImuwiBR07fwADalrKnS6XXpyy9lU64Jx4_jCFQmI8WM_8PWwhVs9uEeWr212IZrr-qudUTaUgdBFGhgBZWyBxkkAKz7phYK8WaZks-5kousLBZWcZlRev1xCZt5VLkTqaFa__JFopOSkpP6PAkLaXN0PYle_cEbB9rqz0pZqic1jaKepLLOo0YVQUhOM-7M30-IE-u5WmLdaI3rqw"
                                alt="System status"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">System Status: Operational</p>
                            <p className="text-xs text-blue-200">v4.2.0 (Stable)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="flex w-full flex-col justify-center bg-background-light px-4 py-12 dark:bg-background-dark lg:w-1/2 lg:px-20 xl:px-32">
                <div className="mx-auto w-full max-w-[480px]">
                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
                            <span className="material-symbols-outlined text-[20px]">dataset</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">NyankoMatch CRM</h2>
                    </div>

                    {/* Page Heading */}
                    <div className="mb-10">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white lg:text-4xl">Welcome Back</h2>
                        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">Please enter your credentials to access the global dashboard.</p>
                    </div>

                    {/* Form */}
                    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium leading-none text-slate-900 dark:text-white" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                                className="input"
                                id="email"
                                placeholder="name@company.com"
                                type="email"
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none text-slate-900 dark:text-white" htmlFor="password">
                                    Password
                                </label>
                            </div>
                            <input {...register("password", { required: "Password is required" })} className="input" id="password" placeholder="Enter your password" type="password" />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>

                        {/* Remember Me & Submit */}
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                Remember me for 30 days
                            </label>

                            <button type="submit" disabled={isLoading} className="btn-primary h-12 w-full text-base font-semibold disabled:opacity-50">
                                {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : "Sign In"}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Don&apos;t have an account? Contact your administrator.</p>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Demo Credentials:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            <strong>Admin:</strong> admin@nyankomatch.com / Admin123!
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            <strong>Manager:</strong> manager@nyankomatch.com / Manager123!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
