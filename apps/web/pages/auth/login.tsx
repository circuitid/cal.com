import classNames from "classnames";
import { jwtVerify } from "jose";
import type { GetServerSidePropsContext } from "next";
import { getCsrfToken, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FaGoogle } from "react-icons/fa";

import { SAMLLogin } from "@calcom/features/auth/SAMLLogin";
import { isSAMLLoginEnabled, samlProductID, samlTenantID } from "@calcom/features/ee/sso/lib/saml";
import { ErrorCode, getSession } from "@calcom/lib/auth";
import { WEBAPP_URL, WEBSITE_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@calcom/lib/telemetry";
import prisma from "@calcom/prisma";
import { Alert, Button, EmailField, PasswordField } from "@calcom/ui";
import { FiArrowLeft } from "@calcom/ui/components/icon";
import { FiInfo } from "@calcom/ui/components/icon";

import type { inferSSRProps } from "@lib/types/inferSSRProps";
import type { WithNonceProps } from "@lib/withNonce";
import withNonce from "@lib/withNonce";

import AddToHomescreen from "@components/AddToHomescreen";
import TwoFactor from "@components/auth/TwoFactor";
import AuthContainer from "@components/ui/AuthContainer";

import { IS_GOOGLE_LOGIN_ENABLED } from "@server/lib/constants";
import { ssrInit } from "@server/lib/ssr";

interface LoginValues {
  email: string;
  password: string;
  totpCode: string;
  csrfToken: string;
}

export default function Login({
  csrfToken,
  isGoogleLoginEnabled,
  isSAMLLoginEnabled,
  samlTenantID,
  samlProductID,
  totpEmail,
  jwtPayload,
}: inferSSRProps<typeof _getServerSideProps> & WithNonceProps) {
  const { t } = useLocale();
  const router = useRouter();
  const methods = useForm<LoginValues>();

  const { register, formState } = methods;
  const [twoFactorRequired, setTwoFactorRequired] = useState(!!totpEmail || false);
  //const [jwtPayload, setjwtPayload] = useState<LoginValues | null>(jwtPayload);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorMessages: { [key: string]: string } = {
    // [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    // Don't leak information about whether an email is registered or not
    [ErrorCode.IncorrectUsernamePassword]: t("incorrect_username_password"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  const telemetry = useTelemetry();

  let callbackUrl = typeof router.query?.callbackUrl === "string" ? router.query.callbackUrl : "";

  if (/"\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);

  // If not absolute URL, make it absolute
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);

  callbackUrl = safeCallbackUrl || "";

  const LoginFooter = (
    <a href={`${WEBSITE_URL}/signup`} className="text-brand-500 font-medium">
      {t("dont_have_an_account")}
    </a>
  );

  const TwoFactorFooter = (
    <Button
      onClick={() => {
        setTwoFactorRequired(false);
        methods.setValue("totpCode", "");
      }}
      StartIcon={FiArrowLeft}
      color="minimal">
      {t("go_back")}
    </Button>
  );

  const ExternalTotpFooter = (
    <Button
      onClick={() => {
        window.location.replace("/");
      }}
      color="minimal">
      {t("cancel")}
    </Button>
  );

  const onSubmit = useCallback(async (values: LoginValues) => {
    setErrorMessage(null);
    telemetry.event(telemetryEventTypes.login, collectPageParameters());
    const res = await signIn<"credentials">("credentials", {
      ...values,
      callbackUrl,
      redirect: false,
    });
    console.log("res", res);
    if (!res) setErrorMessage(errorMessages[ErrorCode.InternalServerError]);
    // we're logged in! let's do a hard refresh to the desired url
    else if (!res.error) router.push(callbackUrl);
    // reveal two factor input if required
    else if (res.error === ErrorCode.SecondFactorRequired) setTwoFactorRequired(true);
    // fallback if error not found
    else setErrorMessage(errorMessages[res.error] || t("something_went_wrong"));
  }, []);

  useEffect(() => {
    if (jwtPayload) onSubmit(jwtPayload);
  }, [jwtPayload]);

  return (
    <>
      {errorMessage && (
        <AuthContainer title={t("logged_out")} description={t("youve_been_logged_out")} showLogo>
          <div className="mb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <FiInfo className="h-6 w-6 text-red-500" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                {t(errorMessage)}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{t("error_during_login")}</p>
              </div>
            </div>
          </div>
        </AuthContainer>
      )}
      {!errorMessage && jwtPayload && (
        <>
          <div className="flex min-h-screen flex-col justify-center" style={{ alignItems: "center" }}>
            <img
              className="w-auto"
              style={{ height: "300px", width: "300px" }}
              alt="Circuit ID"
              title="Circuit ID"
              src="/default-animated.gif"
            />
          </div>
        </>
      )}
      {!errorMessage && !jwtPayload && (
        <>
          <AuthContainer
            title={t("login")}
            description={t("login")}
            showLogo
            heading={twoFactorRequired ? t("2fa_code") : t("welcome_back")}
            footerText={
              twoFactorRequired
                ? !totpEmail
                  ? TwoFactorFooter
                  : ExternalTotpFooter
                : process.env.NEXT_PUBLIC_DISABLE_SIGNUP !== "true"
                ? LoginFooter
                : null
            }>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} data-testid="login-form">
                <div>
                  <input
                    defaultValue={csrfToken || undefined}
                    type="hidden"
                    hidden
                    {...register("csrfToken")}
                  />
                </div>
                <div className="space-y-6">
                  <div className={classNames("space-y-6", { hidden: twoFactorRequired })}>
                    <EmailField
                      id="email"
                      label={t("email_address")}
                      defaultValue={totpEmail || (router.query.email as string)}
                      placeholder="john.doe@example.com"
                      required
                      {...register("email")}
                    />
                    <div className="relative">
                      <div className="absolute -top-[6px]  z-10 ltr:right-0 rtl:left-0">
                        <Link
                          href="/auth/forgot-password"
                          tabIndex={-1}
                          className="text-sm font-medium text-gray-600">
                          {t("forgot")}
                        </Link>
                      </div>
                      <PasswordField
                        id="password"
                        autoComplete="off"
                        required={!totpEmail}
                        className="mb-0"
                        {...register("password")}
                      />
                    </div>
                  </div>

                  {twoFactorRequired && <TwoFactor center />}

                  {errorMessage && <Alert severity="error" title={errorMessage} />}
                  <Button
                    type="submit"
                    color="primary"
                    disabled={formState.isSubmitting}
                    className="w-full justify-center">
                    {twoFactorRequired ? t("submit") : t("sign_in")}
                  </Button>
                </div>
              </form>
              {!twoFactorRequired && (
                <>
                  {(isGoogleLoginEnabled || isSAMLLoginEnabled) && <hr className="my-8" />}
                  <div className="space-y-3">
                    {isGoogleLoginEnabled && (
                      <Button
                        color="secondary"
                        className="w-full justify-center"
                        data-testid="google"
                        StartIcon={FaGoogle}
                        onClick={async (e) => {
                          e.preventDefault();
                          await signIn("google");
                        }}>
                        {t("signin_with_google")}
                      </Button>
                    )}
                    {isSAMLLoginEnabled && (
                      <SAMLLogin
                        samlTenantID={samlTenantID}
                        samlProductID={samlProductID}
                        setErrorMessage={setErrorMessage}
                      />
                    )}
                  </div>
                </>
              )}
            </FormProvider>
          </AuthContainer>
          <AddToHomescreen />
        </>
      )}
    </>
  );
}

// TODO: Once we understand how to retrieve prop types automatically from getServerSideProps, remove this temporary variable
const _getServerSideProps = async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const session = await getSession({ req });
  const ssr = await ssrInit(context);
  const csrfToken = await getCsrfToken(context);

  const verifyJwt = (jwt: string) => {
    const secret = new TextEncoder().encode(process.env.CALENDSO_ENCRYPTION_KEY);

    return jwtVerify(jwt, secret, {
      issuer: WEBSITE_URL,
      audience: `${WEBSITE_URL}/auth/login`,
      algorithms: ["HS256"],
    });
  };

  let totpEmail = null;
  if (context.query.totp) {
    try {
      const decryptedJwt = await verifyJwt(context.query.totp as string);
      if (decryptedJwt.payload) {
        totpEmail = decryptedJwt.payload.email as string;
      } else {
        return {
          redirect: {
            destination: "/auth/error?error=JWT%20Invalid%20Payload",
            permanent: false,
          },
        };
      }
    } catch (e) {
      return {
        redirect: {
          destination: "/auth/error?error=Invalid%20JWT%3A%20Please%20try%20again",
          permanent: false,
        },
      };
    }
  }

  let jwtPayload = null;
  if (context.query.jwt) {
    try {
      const decryptedJwt = await verifyJwt(context.query.jwt as string);

      if (
        decryptedJwt.payload &&
        typeof decryptedJwt.payload === "object" &&
        decryptedJwt.payload.sub &&
        decryptedJwt.payload.email &&
        decryptedJwt.payload.name &&
        decryptedJwt.payload.timezone
      )
        jwtPayload = {
          _id: decryptedJwt.payload.sub.trim(),
          email: decryptedJwt.payload.email,
          name: decryptedJwt.payload.name,
          timezone: decryptedJwt.payload.timezone,
          avatar: decryptedJwt.payload.avatar ? decryptedJwt.payload.avatar : "",
          totpCode: "",
          password: "",
          csrfToken: csrfToken || "",
          jwtLogin: true,
        };
    } catch (e) {
      return {
        redirect: {
          destination: "/auth/error?error=JWT%20Invalid%20Payload",
          permanent: false,
        },
      };
    }
  }

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    // Proceed to new onboarding to create first admin user
    return {
      redirect: {
        destination: "/auth/setup",
        permanent: false,
      },
    };
  }
  return {
    props: {
      jwtPayload: jwtPayload,
      csrfToken: csrfToken,
      trpcState: ssr.dehydrate(),
      isGoogleLoginEnabled: IS_GOOGLE_LOGIN_ENABLED,
      isSAMLLoginEnabled,
      samlTenantID,
      samlProductID,
      totpEmail,
    },
  };
};

export const getServerSideProps = withNonce(_getServerSideProps);
