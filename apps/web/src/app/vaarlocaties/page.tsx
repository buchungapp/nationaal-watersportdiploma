import LocationsMap from "../_components/locations-map";

export default function Page() {
  return (
    <div className="container mx-auto py-16">
      <div className="grid grid-cols-2">
        <div></div>
        <div className="w-full h-[80vh]">
          <LocationsMap />
        </div>
      </div>
    </div>
  );
}
