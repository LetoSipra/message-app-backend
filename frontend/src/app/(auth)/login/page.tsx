import LoginSignInForm from "../(components)/LoginSignInForm";

export default function Page() {
  return (
    <div className={`flex h-screen`}>
      <div className="m-auto w-96 rounded-lg border-2 border-[#27272A] tracking-wide">
        <div className="space-y-5 p-10">
          <h1 className="text-xl text-center">Welcome to message-app</h1>
          <h4 className="text-lg text-center mb-10">
            Please login to continue
          </h4>
          <LoginSignInForm />
        </div>
      </div>
    </div>
  );
}
