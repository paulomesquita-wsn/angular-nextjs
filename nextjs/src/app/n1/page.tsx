import { CComponent } from "@/components/client";
import { SComponent } from "@/components/server";

export default function N1() {
  return (
    <>
      <CComponent />
      <div style={{ margin: "20px 0px" }}>
        {process.env.VERCEL === "1"
          ? "This is running on VERCEL"
          : "This is not running on VERCEL"}
      </div>
      <SComponent />
    </>
  );
}
