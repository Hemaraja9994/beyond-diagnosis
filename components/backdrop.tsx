export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <img className="drift drift-a" src="/brand/udid-sample.svg" alt="" />
      <img className="drift drift-b" src="/brand/udid-sample.svg" alt="" />
      <img className="drift drift-c" src="/brand/udid-sample.svg" alt="" />
      <div className="gov-float drift-d">
        <span className="band saffron" />
        <span className="band white" />
        <span className="band green" />
        <p>Government of India</p>
      </div>
      <div className="gov-float drift-e">
        <span className="band saffron" />
        <span className="band white" />
        <span className="band green" />
        <p>UDID</p>
      </div>
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
    </div>
  );
}
