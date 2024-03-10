import { Children, ComponentProps, ReactElement, cloneElement, isValidElement } from "react";
import Balancer from "react-wrap-balancer";
import { twMerge } from "tailwind-merge";
import Double from "~/app/_components/brand/double-line";

export default function Article({
  children,
  className,
  justify,
  ...props
}: ComponentProps<"article"> & {
  justify?: "center" | "start" | "end";
}) {
  const childrenWithProps = Children.map(children, (child) =>
    isValidElement(child)
      ? cloneElement(child as ReactElement<any>, { justify, ...child.props })
      : child,
  );

  return (
    <article {...props} className={twMerge("flex flex-col gap-2", className)}>
      {childrenWithProps}
    </article>
  );
}

Article.Heading = function ArticleHeading({
  className,
  justify = "start",
  children,
  ...props
}: ComponentProps<"div"> & {
  justify?: "center" | "start" | "end";
}) {
  return (
    <div {...props} className={twMerge("flex gap-3 items-center", className)}>
      {justify !== "start" ? <Double /> : null}
      <span className="uppercase whitespace-nowrap font-bold">{children}</span>
      {justify !== "end" ? <Double /> : null}
    </div>
  );
};

Article.Title = function ArticleTitle({
  children,
  className,
  as = "h2",
  balance = true,
  justify = "start",
  ...props
}: ComponentProps<"h1"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  balance?: boolean;
  justify?: "center" | "start" | "end";
}) {
  const Component = as;
  return (
    <Component
      {...props}
      className={twMerge(
        "font-bold text-2xl",
        justify === "center" && "text-center",
        justify === "end" && "text-end",
        className,
      )}
    >
      {balance ? <Balancer>{children}</Balancer> : children}
    </Component>
  );
};

Article.Paragraph = function ArticleParagraph({
  children,
  className,
  justify = "start",
  ...props
}: ComponentProps<"p"> & {
  justify?: "center" | "start" | "end";
}) {
  return (
    <p
      {...props}
      className={twMerge(
        justify === "center" && "text-center self-center",
        justify === "end" && "text-end self-end",
        className,
      )}
    >
      {children}
    </p>
  );
};

Article.ButtonSection = function ArticleButtonSection({
  children,
  className,
  justify = "start",
  ...props
}: ComponentProps<"div"> & {
  justify?: "center" | "start" | "end";
}) {
  return (
    <div
      {...props}
      className={twMerge(
        "flex flex-col sm:flex-row gap-x-6 gap-y-2",
        justify === "center" && "items-center sm:justify-center",
        justify === "end" && "items-end sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
};
