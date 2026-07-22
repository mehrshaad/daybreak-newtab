import { Tour } from "antd";
import { useState } from "react";

const NewTour = () => {
  const [, setOpen] = useState(false);
  const steps = [
    {
      title: "Upload File",
      description: "Put your files here.",
      target: () => document.getElementById("home"),
    },
  ];
  return <Tour open={true} onClose={() => setOpen(false)} steps={steps} />;
};
export default NewTour;
