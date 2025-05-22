// import Image from "next/image";
// import { HiOutlineUserCircle, HiGlobeAlt } from "react-icons/hi2";
// import { HiOutlineLogout } from "react-icons/hi";

function Header() {
  return (
    <>
      <header className="mx-2 font-serif">
        <div className="mx-auto my-1.5 max-h-[66px] w-full max-w-3xl rounded-xl border border-solid border-black bg-[#202c33] px-5 py-2 text-[#8696a0]">
          <div className="flex justify-between">
            <div className="my-auto flex">
              <p className="">Room:</p>
              {/* <HiGlobeAlt className="my-auto ml-1 h-4 w-4 text-blue-600" /> */}
              <p>Global</p>
            </div>
            <div className="flex space-x-1">
              {false ? (
                <>
                  {/* <Image
                    src={session.user.image || ""}
                    alt=""
                    height={24}
                    width={24}
                    className="my-auto h-6 w-6 rounded-full object-contain"
                  />
                  <div>
                    <p className="text-sm">{session.user.name}</p>
                    <div
                      className="flex cursor-pointer text-xs text-red-500 hover:underline hover:opacity-80"
                      onClick={() => signOut()}>
                      <HiOutlineLogout className="h-4 w-4" />
                      <p className="">Logout</p>
                    </div>
                  </div> */}
                </>
              ) : (
                <>
                  {/* <HiOutlineUserCircle className="h-6 w-6" /> */}
                  <p className="cursor-pointer hover:underline hover:opacity-80">
                    Login
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
