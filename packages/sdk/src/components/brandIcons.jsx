// Brand marks that react-icons 5.4 does not carry, plus the ones the toolbar
// needs. Paths are from Simple Icons (https://simpleicons.org), which is
// released under CC0-1.0 (public domain), so they can be bundled here. Same
// call signature as a react-icons component: ({ size, color }).
//
// The toolbar's marks live here rather than being pulled from react-icons for a
// reason worth knowing before moving one back. The full brand table imports 166
// components out of react-icons/si, which together are 155KB - 45% of the chunk
// a new tab loads before it can draw anything. That table is only ever used
// inside a widget, and widgets are lazily chunked, so it should not be in that
// chunk at all. But a module lands in exactly one chunk, and react-icons/si is
// one module: the moment anything eager imports a single icon from it, all 166
// come along. The toolbar's search-engine picker was that one importer. Drawing
// its marks here instead is what keeps react-icons/si on the lazy side.

function svgProps(size, color) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color || "currentColor",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
    focusable: "false",
  };
}

// Microsoft Bing - absent from react-icons 5.4, which is why the search-engine
// picker previously fell back to a generic magnifying glass.
export function SiMicrosoftbing({ size = 24, color }) {
  return (
    <svg {...svgProps(size, color)}>
      <path d="M20.176 15.406a6.48 6.48 0 01-1.736 4.414c1.338-1.47.803-3.869-1.003-4.635-.862-.305-2.488-.85-3.367-1.158a1.834 1.834 0 01-.932-.818c-.381-.975-1.163-2.968-1.548-3.948-.095-.285-.31-.625-.265-.938.046-.598.724-1.003 1.276-.754l3.682 1.888c.621.292 1.305.692 1.796 1.172a6.486 6.486 0 012.097 4.777zm-1.44 1.888c-.264-1.194-1.135-1.744-2.216-2.028-1.527.902-4.853 2.878-6.952 4.13-1.103.68-2.13 1.35-2.919 1.242a2.866 2.866 0 01-2.77-2.325c-.012-.048-.008-.03-.001.01a6.4 6.4 0 00.947 2.653 6.498 6.498 0 005.486 3.022c1.908.062 3.536-1.153 5.099-2.096.292-.188.804-.496 1.332-.831l1.423-1.51c.553-.577.764-1.426.571-2.267zm-12.04 2.97c.422 0 .822-.1 1.173-.29.355-.215.964-.579 1.7-1.018L9.57 4.502c0-.99-.497-1.864-1.257-2.382-.08-.059-2.91-1.901-2.99-1.956-.605-.432-1.523.045-1.5.797v14.887l.417 2.36a2.488 2.488 0 002.455 2.056z" />
    </svg>
  );
}

// DuckDuckGo. react-icons does carry this one, but importing it from there is
// what would drag all 166 of its siblings into the eager chunk - see above.
export function SiDuckduckgo({ size = 24, color }) {
  return (
    <svg {...svgProps(size, color)}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 23C5.925 23 1 18.074 1 12S5.926 1 12 1s11 4.925 11 11-4.925 11-11 11zm10.219-11c0 4.805-3.317 8.833-7.786 9.925-.27-.521-.53-1.017-.749-1.438.645.249 1.93.718 2.208.615.376-.144.282-3.149-.14-3.245-.338-.075-1.632.837-2.141 1.209l.034.156c.078.397.144.993.03 1.247-.001.004-.002.01-.004.013a.218.218 0 0 1-.068.088c-.284.188-1.081.284-1.503.188a.516.516 0 0 1-.064-.02c-.694.396-2.01 1.109-2.25.971-.329-.188-.377-2.676-.329-3.288.035-.46 1.653.286 2.442.679.174-.163.602-.272.98-.31-.57-1.389-.99-2.977-.733-4.105 0 .002.002.002.002.002.356.248 2.73 1.05 3.91 1.027 1.18-.024 3.114-.743 2.903-1.323-.212-.58-2.135.51-4.142.324-1.486-.138-1.748-.804-1.42-1.29.414-.611 1.168.116 2.411-.256 1.245-.371 2.987-1.035 3.632-1.397 1.494-.833-.625-1.177-1.125-.947-.474.22-2.123.637-2.889.82.428-1.516-.603-4.149-1.757-5.3-.376-.376-.951-.612-1.603-.736-.25-.344-.654-.671-1.225-.977a5.772 5.772 0 0 0-3.595-.584l-.024.004-.034.004.004.002c-.148.028-.237.08-.357.098.148.016.705.276 1.057.418-.174.068-.412.108-.596.184a.828.828 0 0 0-.204.056c-.173.08-.303.375-.3.515.84-.086 2.082-.026 2.991.246-.644.09-1.235.258-1.661.482-.016.008-.03.018-.048.028-.054.02-.106.042-.152.066-1.367.72-1.971 2.405-1.611 4.424.323 1.824 1.665 8.088 2.29 11.064-3.973-1.4-6.822-5.186-6.822-9.639C1.781 6.356 6.356 1.781 12 1.781S22.219 6.356 22.219 12zM9.095 9.581a.758.758 0 1 0 0 1.516.758.758 0 0 0 0-1.516zm.338.702a.196.196 0 1 1 0-.392.196.196 0 0 1 0 .392zm4.724-1.043a.65.65 0 1 0 0 1.299.65.65 0 0 0 0-1.3zm.29.601a.168.168 0 1 1 0-.336.168.168 0 0 1 0 .336zM9.313 8.146s-.571-.26-1.125.09c-.554.348-.534.704-.534.704s-.294-.656.49-.978c.786-.32 1.17.184 1.17.184zm5.236-.052s-.41-.234-.73-.23c-.654.008-.831.296-.831.296s.11-.688.945-.55a.84.84 0 0 1 .616.484z" />
    </svg>
  );
}
