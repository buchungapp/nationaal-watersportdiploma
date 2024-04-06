export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    //  Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430
    <div>
      {/* Header */}
      <div id="content">{children}</div>
      {/* Footer */}
    </div>
  );
}
