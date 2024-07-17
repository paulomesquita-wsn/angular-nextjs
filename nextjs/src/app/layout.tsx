export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: "0px", padding: "0px" }}>
        <div style={{ width: "100vw", height: "100vh" }}>
          <div
            id="top-bar"
            style={{
              width: "100%",
              height: "40px",
              border: "1px solid #ccc",
              padding: "5px 10px",
            }}
          >
            <div style={{ fontWeight: "bold", marginTop: "10px" }}>NEXT.JS</div>
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "calc(100% - 100px)",
            }}
          >
            <div
              id="sidebar-menu"
              style={{
                width: "40px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "center",
                paddingTop: "20px",
                border: "1px solid #ccc",
              }}
            >
              <a href="/a1" style={{ cursor: "pointer", fontWeight: "bold" }}>
                A1
              </a>
              <a href="/a2" style={{ cursor: "pointer", fontWeight: "bold" }}>
                A2
              </a>
              <a href="/n1" style={{ cursor: "pointer", fontWeight: "bold" }}>
                N1
              </a>
              <a href="/a3" style={{ cursor: "pointer", fontWeight: "bold" }}>
                A3
              </a>
            </div>
            <div id="body" style={{ marginTop: "25px", padding: "0px 20px" }}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
