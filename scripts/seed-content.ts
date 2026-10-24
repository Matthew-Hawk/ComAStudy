// Original teaching content. Official PDFs supply scope/numbering only, never questions or lessons.
import { mkdirSync, writeFileSync } from "node:fs";
type Seed = {
  number: string;
  title: string;
  summary: string;
  visual: string;
  paragraphs: [string, string];
  question: string;
  choices: [string, string, string];
  wrong: [string, string];
  blank: string;
  variant: string;
  accepted: string[];
  hint: string;
  flash: [string, string];
};
const seeds: Seed[][] = [
  [
    {
      number: "1.1",
      title: "Inside a mobile device",
      summary: "Replace components with care and a plan.",
      visual: "memory-board",
      paragraphs: [
        "A laptop packs familiar components into a small, model-specific enclosure. Its battery stores energy, its RAM holds active work, and its SSD retains files after shutdown. A slow system does not automatically need more storage: check whether memory pressure, a full drive, or thermal throttling explains the symptom. Before purchasing a replacement, consult the service guide for the exact model and confirm which components can actually be removed.",
        "Prepare a clean workspace, shut down the device, disconnect external power, and follow the manufacturer’s battery-disconnection procedure before touching internal parts. Use suitable electrostatic-discharge protection and keep a record of screw positions. Handle memory by its edges rather than its contacts. Antenna leads and ribbon connectors are delicate; release their latches as documented instead of pulling harder. A swollen battery requires an approved safety procedure, never pressure or puncturing.",
      ],
      question:
        "Which component holds the active working data of running applications?",
      choices: ["RAM", "SSD", "Battery"],
      wrong: [
        "An SSD keeps files between sessions; working data needs a different kind of memory.",
        "A battery supplies energy rather than storing application working data.",
      ],
      blank:
        "The component that retains files after shutdown is the {{blank}}.",
      variant: "A laptop uses an {{blank}} for persistent solid-state storage.",
      accepted: ["SSD", "solid-state drive", "solid state drive"],
      hint: "Distinguish temporary working memory from persistent storage.",
      flash: [
        "Why check a model’s service guide before replacing laptop RAM?",
        "Memory may be soldered, and supported module types and replacement procedures vary by model.",
      ],
    },
    {
      number: "1.2",
      title: "Connections on the go",
      summary: "Choose the right connection for the task.",
      visual: "connector-sheet",
      paragraphs: [
        "A connector’s shape is only one part of a connection. USB-C describes a reversible physical connector; the device, port, and cable still determine supported data speed, charging, and video features. A cable that charges a laptop may not support an external display. Read the specifications at both ends and check the cable rating before promising that one lead will handle everything on a desk.",
        "Bluetooth is useful for nearby peripherals such as headsets and keyboards. Pairing establishes a trusted relationship between devices, while NFC typically exchanges small amounts of information at very short range. A mobile hotspot shares an upstream cellular connection with other devices and can consume a data allowance quickly. Docks consolidate desk connections, but features depend on the host interface and dock capabilities. Test video, networking, charging, and peripherals separately when investigating a dock issue.",
      ],
      question:
        "Does a USB-C connector guarantee that a port supports video output?",
      choices: [
        "No; verify port and cable capabilities",
        "Yes; every USB-C port carries video",
        "Only when Bluetooth is enabled",
      ],
      wrong: [
        "Connector shape does not specify every supported protocol or alternate mode.",
        "Bluetooth pairing does not enable video features on a wired port.",
      ],
      blank:
        "A short-range wireless headset commonly connects using {{blank}}.",
      variant:
        "Pairing a nearby wireless keyboard usually establishes a {{blank}} connection.",
      accepted: ["Bluetooth"],
      hint: "Think of the radio used for personal peripherals.",
      flash: [
        "What is a mobile hotspot?",
        "A device sharing its internet connection, often cellular, with nearby client devices.",
      ],
    },
  ],
  [
    {
      number: "2.1",
      title: "Ports, protocols & purpose",
      summary: "Understand the conversation behind a connection.",
      visual: "network-packet-hop",
      paragraphs: [
        "An IP address identifies a network interface, while a transport port helps deliver traffic to the intended service. A browser reaching an encrypted website normally uses HTTPS on port 443. DNS normally answers name-resolution queries on port 53. SSH commonly uses port 22 for encrypted remote terminal access. These are conventional defaults, not guarantees: an administrator can move a service to another port.",
        "TCP establishes a connection, numbers data, and retransmits missing segments so applications receive an ordered byte stream. UDP sends independent datagrams without providing those same delivery guarantees. This lower transport overhead suits applications that manage timing or recovery themselves. DNS commonly uses UDP for ordinary queries but also uses TCP when appropriate; avoid treating a service as permanently tied to only one transport. When diagnosing connectivity, check the destination address, service port, transport, and any firewall rule together.",
      ],
      question:
        "A technician needs an encrypted remote terminal. Which default port is the best match?",
      choices: ["22", "53", "80"],
      wrong: [
        "Port 53 is associated with name resolution, not an encrypted terminal session.",
        "Port 80 usually carries unencrypted web traffic rather than remote terminal access.",
      ],
      blank: "The default port for HTTPS is {{blank}}.",
      variant:
        "An encrypted web service normally listens on TCP port {{blank}}.",
      accepted: ["443"],
      hint: "Recall the secure counterpart to HTTP, rather than plain web traffic.",
      flash: [
        "What does TCP add that UDP does not provide itself?",
        "An ordered, reliable byte stream using sequencing and retransmission.",
      ],
    },
    {
      number: "2.2",
      title: "Wireless without the guesswork",
      summary: "Make sense of bands, channels, and interference.",
      visual: "network-packet-hop",
      paragraphs: [
        "Wireless clients share radio airtime. A strong signal does not guarantee a fast connection when neighboring devices compete on the same channel. The 2.4 GHz band generally reaches farther through obstacles than higher bands but is often crowded. The 5 GHz and 6 GHz bands offer additional channel space for compatible equipment. Available channels and power limits depend on the local regulatory region, so configure devices for their actual location.",
        "A channel occupies a slice of radio spectrum, and wider channels combine more spectrum to increase potential throughput. In a dense office, that wider footprint can overlap more neighbors and reduce effective performance. Use a wireless analyzer to inspect nearby activity, then compare measured performance before and after a change. Client support matters too: an older radio cannot gain a new band through an access-point setting alone. Bluetooth and NFC serve different short-range tasks rather than replacing a wireless LAN.",
      ],
      question:
        "Why can a wider Wi-Fi channel perform poorly in a crowded office?",
      choices: [
        "It occupies more shared spectrum",
        "It changes all clients to Ethernet",
        "It disables the radio antenna",
      ],
      wrong: [
        "Channel width does not turn wireless clients into wired clients.",
        "The antenna still operates; competition and overlap can limit useful airtime.",
      ],
      blank: "The commonly congested lower Wi-Fi band is {{blank}} GHz.",
      variant:
        "Compared with 5 GHz, {{blank}} GHz generally offers better reach through obstacles.",
      accepted: ["2.4"],
      hint: "Think of the band shared with many household devices.",
      flash: [
        "Should every office use the widest possible Wi-Fi channel?",
        "No. Channel width must balance throughput potential with interference and available spectrum.",
      ],
    },
  ],
  [
    {
      number: "3.1",
      title: "Displays, pixels & panels",
      summary: "Separate panel technology from display settings.",
      visual: "connector-sheet",
      paragraphs: [
        "A display’s resolution describes its pixel grid, while its refresh rate describes how often it can update the image each second. These are independent characteristics. A high-resolution panel can still run at a modest refresh rate. Pixel density relates the number of pixels to physical size, which affects perceived sharpness. Color gamut describes the range of colors a display can reproduce rather than how many pixels it contains.",
        "LCD panels use a backlight and a liquid-crystal layer to control transmitted light. OLED pixels emit their own light, allowing very dark black regions when pixels are off. IPS, TN, and VA are LCD panel approaches with different viewing-angle, response, and contrast tradeoffs. A digitizer detects touch input; a visible image with unresponsive touch can therefore involve a separate input component. Before replacing a screen, verify the source, cable, supported resolution, and refresh settings using a known-good connection.",
      ],
      question: "Which display component detects a finger touching the screen?",
      choices: ["Digitizer", "Backlight", "Video cable shielding"],
      wrong: [
        "A backlight provides illumination rather than sensing touch coordinates.",
        "Cable shielding reduces interference; it does not detect touches.",
      ],
      blank:
        "A refresh rate measured in {{blank}} describes updates per second.",
      variant: "A 60 {{blank}} display can update sixty times each second.",
      accepted: ["Hz", "hertz"],
      hint: "Use the unit for frequency.",
      flash: [
        "How does OLED produce light differently from LCD?",
        "OLED pixels emit light; an LCD controls light from a backlight.",
      ],
    },
    {
      number: "3.2",
      title: "Cables that fit the job",
      summary: "Identify connections by purpose and capability.",
      visual: "connector-sheet",
      paragraphs: [
        "Choose a cable by the signal and environment it must support, then confirm the connector. Twisted-pair Ethernet commonly uses an eight-position modular connector often called RJ45. Optical fiber carries light and uses connectors such as LC or SC. Fiber avoids electrical interference along the cable and can suit longer links, but the transceivers, fiber type, and connector must match. A connector that physically fits does not prove end-to-end compatibility.",
        "HDMI and DisplayPort commonly carry digital display signals. VGA carries analog video and does not become digital just because a passive connector adapter changes the plug shape. SATA is used for internal storage data connections, with power supplied separately. USB-C can support several functions, but only those implemented by the devices and cable. In installation spaces, cable jacket ratings also matter: use the appropriate rated cable for the building environment and follow applicable installation requirements rather than choosing purely by color or price.",
      ],
      question:
        "Which medium carries data as light rather than electrical signals?",
      choices: ["Optical fiber", "Twisted-pair copper", "Coaxial copper"],
      wrong: [
        "Twisted-pair copper carries electrical signals and can be affected by electrical interference.",
        "Coaxial cable also carries electrical signals through a conductor.",
      ],
      blank: "A common digital display connector is {{blank}}.",
      variant: "A television’s digital video input is often labeled {{blank}}.",
      accepted: ["HDMI", "DisplayPort"],
      hint: "Think of a digital video connection, rather than a storage connection.",
      flash: [
        "Does a matching connector prove that a cable supports every port feature?",
        "No. Check the cable’s signaling capabilities and ratings as well as its physical shape.",
      ],
    },
  ],
  [
    {
      number: "4.1",
      title: "A computer within a computer",
      summary: "Understand hosts, guests, and hypervisors.",
      visual: "virtual-layers",
      paragraphs: [
        "A virtual machine presents virtual hardware to a guest operating system. The physical host supplies CPU time, RAM, storage, and networking through a hypervisor. A type 1 hypervisor runs directly on hardware, while a type 2 hypervisor runs on a host operating system. Both approaches need enough physical resources for their workloads; assigning more virtual memory than a host can support does not create real memory.",
        "Virtual machines are useful for isolated test environments, legacy applications, and running different operating systems on one machine. Isolation is a design boundary, not a promise of perfect security. Patch guests and hypervisors, control shared folders, and choose network access deliberately. A snapshot captures a point-in-time state useful for rollback but is not an independent backup strategy. Containers typically share a host kernel instead of providing each workload a full guest kernel, so application packaging and virtual machines solve related but different problems.",
      ],
      question: "What distinguishes a type 1 hypervisor?",
      choices: [
        "It runs directly on hardware",
        "It must run inside a browser",
        "It requires a host desktop OS",
      ],
      wrong: [
        "A browser is not the defining execution layer of a type 1 hypervisor.",
        "A host operating system beneath the hypervisor describes the type 2 model.",
      ],
      blank:
        "An operating system inside a virtual machine is called the {{blank}}.",
      variant:
        "The virtualized OS is the {{blank}}, while the physical machine is the host.",
      accepted: ["guest", "guest OS"],
      hint: "Use the counterpart to host.",
      flash: [
        "Is a VM snapshot a complete substitute for an independent backup?",
        "No. Snapshots support rollback but can depend on the same underlying storage.",
      ],
    },
    {
      number: "4.2",
      title: "Cloud services & responsibility",
      summary: "Know what the provider manages and what you manage.",
      visual: "virtual-layers",
      paragraphs: [
        "Cloud services offer computing resources through a service model. With infrastructure as a service, the customer commonly manages guest operating systems and applications on provider-managed infrastructure. Platform as a service supplies a managed application platform so developers focus on their code and data. Software as a service delivers an application for users to configure and use. Moving to a higher-level service changes responsibilities; it does not eliminate the customer’s responsibility for access and data.",
        "A public cloud offers provider-operated resources to many customers. A private cloud is dedicated to one organization, and a hybrid approach connects different environments. Elasticity means capacity can expand and contract with demand, while metered utilization measures resource consumption for management or billing. Shared physical infrastructure does not mean customers intentionally share permissions to each other’s data. Compare availability needs, data location, network connectivity, and ongoing charges before choosing a deployment. File synchronization is convenient, but deletions can synchronize too, so preserve recovery options.",
      ],
      question:
        "Which service model delivers a ready-to-use hosted application?",
      choices: ["SaaS", "IaaS", "A local hypervisor"],
      wrong: [
        "IaaS supplies infrastructure resources; the customer still manages more of the software stack.",
        "A local hypervisor hosts virtual machines rather than defining a hosted application service.",
      ],
      blank:
        "Cloud capacity that expands and contracts with demand demonstrates {{blank}}.",
      variant:
        "Automatically shrinking capacity after demand falls is an example of {{blank}}.",
      accepted: ["elasticity"],
      hint: "Think of resources stretching and shrinking.",
      flash: [
        "Does a SaaS provider remove all customer security responsibilities?",
        "No. Customers still manage access, configuration, and appropriate handling of their data.",
      ],
    },
  ],
  [
    {
      number: "5.1",
      title: "When hardware misbehaves",
      summary: "Connect power, memory, and thermal symptoms.",
      visual: "memory-board",
      paragraphs: [
        "A computer that shuts down under load may be protecting itself from excessive temperature, but the symptom alone does not identify the faulty part. Record when the shutdown happens and inspect safe, observable evidence such as fan operation, airflow, and reported temperatures. A machine with no power needs a different starting point: verify the outlet, external cable, power switch, and appropriate supply connections before blaming the operating system.",
        "POST signals can narrow a startup failure, but their meaning depends on the manufacturer and model. Look up the documented code rather than assuming every beep pattern is universal. Intermittent crashes can involve memory, power, heat, drivers, or applications, so change one variable at a time and test the result. If there is smoke or a burning smell, stop testing and follow electrical safety procedures. Never open a power supply to investigate its internals; hazardous stored energy can remain after unplugging it.",
      ],
      question:
        "A desktop emits a burning smell. What is the appropriate immediate response?",
      choices: [
        "Stop testing and follow electrical safety procedures",
        "Keep benchmarking to collect more data",
        "Open the power supply immediately",
      ],
      wrong: [
        "Continuing a load test can worsen an electrical or thermal hazard.",
        "Power supplies may retain hazardous energy and are not field-repair items for this task.",
      ],
      blank: "Startup hardware checks are commonly called {{blank}}.",
      variant:
        "A manufacturer’s beep code can report a failure during {{blank}}.",
      accepted: ["POST", "power-on self-test", "power on self test"],
      hint: "The acronym describes the self-test at power-on.",
      flash: [
        "Are POST beep codes universal?",
        "No. Interpret them using documentation for the exact system or firmware vendor.",
      ],
    },
    {
      number: "5.2",
      title: "Drive trouble & RAID recovery",
      summary: "Protect data before pursuing a repair.",
      visual: "raid-mirror",
      paragraphs: [
        "Storage faults can appear as slow reads, missing volumes, unusual noises, or health warnings. A clicking mechanical drive may be failing, and repeated scans can increase stress on fragile hardware. Determine the value of the data and whether a verified backup exists before running repair tools. A missing drive may instead have a disconnected cable or a controller issue, so gather evidence without making unnecessary writes.",
        "RAID 1 mirrors data across drives, allowing an array to keep operating through some single-drive failures. RAID 0 stripes data for performance and provides no redundancy. Neither arrangement protects against every cause of data loss: accidental deletion, corruption, theft, and malware can affect the array. When an array reports a failed member, identify the exact drive through the controller’s information and the vendor procedure before replacing anything. Rebuilding can stress remaining drives, and pulling a healthy member from a degraded array can destroy availability. Verify backups and escalate uncertain recovery situations.",
      ],
      question: "Which RAID level mirrors data for redundancy?",
      choices: ["RAID 1", "RAID 0", "A single unprotected disk"],
      wrong: [
        "RAID 0 distributes data across drives but does not keep a redundant mirror.",
        "One unprotected disk has no second copy available after that disk fails.",
      ],
      blank: "RAID {{blank}} uses striping without redundancy.",
      variant:
        "An array with no fault tolerance that stripes data is RAID {{blank}}.",
      accepted: ["0", "zero"],
      hint: "Separate the stripe-only arrangement from the mirrored arrangement.",
      flash: [
        "Why is RAID not a substitute for backups?",
        "An array can still lose data through deletion, corruption, malware, or loss of the entire system.",
      ],
    },
  ],
  [
    {
      number: "1.1",
      title: "Operating systems & filesystems",
      summary: "Match the platform to the workload.",
      visual: "virtual-layers",
      paragraphs: [
        "An operating system manages hardware resources and provides services to applications. Desktop platforms such as Windows, Linux, and macOS differ in supported applications, management tools, and hardware compatibility. Mobile platforms emphasize touch input, battery management, and controlled application permissions. Choosing a platform starts with the required applications, supported hardware, organizational policies, and the vendor’s supported life cycle rather than personal familiarity alone.",
        "A filesystem organizes stored data and defines features such as permissions, journaling, and size limits. NTFS is common for Windows system volumes and supports access permissions. APFS is associated with modern Apple systems, and ext4 is common on Linux. exFAT can be useful for removable media shared between platforms, while FAT32 has a roughly four-gigabyte single-file limit. A device recognizing a physical disk does not guarantee that it can read every filesystem on that disk. Before formatting, preserve needed data and verify the intended systems can read the chosen format.",
      ],
      question:
        "Which filesystem is a common choice for a Windows system volume with access permissions?",
      choices: ["NTFS", "FAT32 because it has no limits", "An HDMI connector"],
      wrong: [
        "FAT32 has meaningful limits and does not supply NTFS-style access permissions.",
        "HDMI is a display interface, not a filesystem.",
      ],
      blank: "A common Linux filesystem is {{blank}}.",
      variant:
        "Many Linux installations use the fourth extended filesystem, abbreviated {{blank}}.",
      accepted: ["ext4"],
      hint: "Think of the extended filesystem family.",
      flash: [
        "Why check OS life-cycle support before deployment?",
        "Unsupported systems may stop receiving security updates and lose application compatibility.",
      ],
    },
    {
      number: "1.2",
      title: "Install with a recovery plan",
      summary: "Prepare, deploy, and verify an operating system.",
      visual: "support-cycle",
      paragraphs: [
        "An operating system installation can replace an existing environment or upgrade it in place. A clean install creates a fresh environment and may erase existing data, while an upgrade aims to retain supported applications and settings. Neither option removes the need for a verified backup. Check hardware requirements, driver availability, application compatibility, licensing, and the intended installation source before starting. A recovery plan must be usable even if the new operating system fails to boot.",
        "Boot media can be local, removable, or network-based. Match the firmware’s supported boot mode and partitioning requirements to the operating system; modern UEFI deployments commonly use GPT. An image deployment can standardize many machines, but the image still needs appropriate drivers, updates, and organization-specific configuration. After installation, validate network access, device functionality, updates, security configuration, and required applications. Confirm that the user can perform their actual work, then document the outcome and preserve the agreed recovery path until the change is accepted.",
      ],
      question:
        "What should happen before a clean OS installation that may erase data?",
      choices: [
        "Verify a restorable backup",
        "Assume the installer preserves every file",
        "Delete all recovery media",
      ],
      wrong: [
        "A clean installation can remove existing data and settings.",
        "Removing recovery media weakens the ability to recover from a failed installation.",
      ],
      blank:
        "Modern UEFI deployments commonly use the {{blank}} partition table.",
      variant: "The GUID Partition Table is abbreviated {{blank}}.",
      accepted: ["GPT"],
      hint: "This is the newer alternative to MBR.",
      flash: [
        "What is the difference between a clean install and an upgrade?",
        "A clean install creates a fresh environment; an upgrade attempts to retain supported applications and settings.",
      ],
    },
  ],
  [
    {
      number: "2.1",
      title: "Security in layers",
      summary: "Protect people, devices, and access.",
      visual: "support-cycle",
      paragraphs: [
        "Security controls reduce risk at different boundaries. A locked equipment room limits physical access, while an account permission limits what a signed-in user can do. Cameras can help detect and investigate events but do not physically prevent entry by themselves. Layered protection combines preventive, detective, and corrective measures so one control’s failure does not remove every defense. Choose controls that address an actual threat rather than adding complexity without a purpose.",
        "The principle of least privilege grants only the access needed for a task. Multifactor authentication combines different factor types, such as something known and something possessed; two passwords are still the same factor type. Single sign-on reduces repeated sign-ins across applications but needs careful account protection. Just-in-time privileged access limits how long elevated permissions remain available. Zero Trust evaluates access explicitly instead of treating a network location as proof of trust. Review access when roles change, remove unused permissions, and retain useful records for investigation.",
      ],
      question:
        "Which combination uses two different authentication factor types?",
      choices: [
        "A password and a hardware security key",
        "Two different passwords",
        "A password and a memorized PIN",
      ],
      wrong: [
        "Two passwords are both knowledge factors, so they do not create two factor types.",
        "A password and a memorized PIN are both things the user knows.",
      ],
      blank:
        "Granting only the access needed follows the principle of least {{blank}}.",
      variant:
        "Avoiding unnecessary administrative rights is least {{blank}} in practice.",
      accepted: ["privilege"],
      hint: "Think of limiting the rights an account receives.",
      flash: [
        "Does being on an internal network automatically prove trust?",
        "No. Access should still be verified and limited to the required resources.",
      ],
    },
    {
      number: "2.2",
      title: "Everyday Windows protection",
      summary: "Use accounts, encryption, and permissions deliberately.",
      visual: "support-cycle",
      paragraphs: [
        "A standard account reduces the impact of everyday mistakes and malicious programs by limiting administrative actions. Use an elevated context only when a task requires it. User Account Control provides an elevation boundary and a prompt for approval or credentials; approving an unfamiliar prompt without checking its origin defeats the intended protection. Local accounts and organization-managed identities have different administration paths, so verify which identity is actually being used.",
        "A firewall controls traffic according to rules, while antivirus tools look for malicious behavior or known threats. Disabling either control broadly to solve a connection problem creates unnecessary exposure; investigate the specific application and rule instead. BitLocker protects data on an encrypted volume, but access to a running, unlocked system still matters. Store recovery information through the approved process before making changes that could affect boot or encryption. For shared files, effective access depends on both share permissions and filesystem permissions, so test using the intended user account.",
      ],
      question:
        "Which account type is generally appropriate for everyday work?",
      choices: [
        "A standard user account",
        "A permanently elevated administrator",
        "An unknown shared administrator account",
      ],
      wrong: [
        "Permanent elevation gives routine applications more power than they need.",
        "Shared administrative identities reduce accountability and grant excessive routine access.",
      ],
      blank: "Windows volume encryption is commonly provided by {{blank}}.",
      variant:
        "The Windows feature that encrypts an entire volume is {{blank}}.",
      accepted: ["BitLocker"],
      hint: "This protects a volume at rest rather than filtering network packets.",
      flash: [
        "Why preserve encryption recovery information before firmware changes?",
        "A change can trigger recovery, and missing recovery information can prevent access to the data.",
      ],
    },
  ],
  [
    {
      number: "3.1",
      title: "Diagnose Windows issues",
      summary: "Use evidence before changing a working system.",
      visual: "support-cycle",
      paragraphs: [
        "Slow performance and crashes describe symptoms rather than causes. First establish what changed, which users are affected, when the issue began, and whether it can be reproduced. Task Manager can reveal resource pressure and a process consuming CPU, memory, or disk activity. Event logs can provide timestamps and error context. Correlate those observations with the reported problem instead of treating every warning in a log as the cause.",
        "A startup issue may involve firmware boot selection, storage access, system files, or a recent driver change. Record the exact error and use the least disruptive suitable diagnostic path. A recent update is a useful clue, not proof of causation. Before rollback or repair, consider the user’s data, recovery keys, backup status, and authorization. Test one change at a time so the result remains interpretable. After an apparent fix, repeat the original task and check related functionality; a computer merely reaching the desktop does not prove the user’s issue is resolved.",
      ],
      question:
        "What is a useful first step when a user reports a newly slow PC?",
      choices: [
        "Gather the timeline and inspect resource use",
        "Reinstall immediately without a backup",
        "Delete every warning in the logs",
      ],
      wrong: [
        "Immediate reinstallation is disruptive and can lose data without establishing the cause.",
        "Deleting log entries removes evidence and does not repair the source of a warning.",
      ],
      blank:
        "The Windows utility for examining active process resource use is {{blank}}.",
      variant: "To inspect a process consuming CPU, open {{blank}}.",
      accepted: ["Task Manager"],
      hint: "This utility shows processes and performance.",
      flash: [
        "Why change one variable at a time during diagnosis?",
        "It makes the effect of each change interpretable and helps identify the actual cause.",
      ],
    },
    {
      number: "3.2",
      title: "Recover mobile applications",
      summary: "Troubleshoot crashes, updates, and connectivity.",
      visual: "support-cycle",
      paragraphs: [
        "A mobile application that crashes or refuses to update can have several causes: insufficient storage, an unsupported operating system, a damaged local cache, or a connectivity problem. Record the application version, operating system version, error message, and recent changes. Check whether one application is affected or whether many applications show the same symptom. That distinction helps separate an application-specific fault from a wider device or network condition.",
        "Start with low-impact checks such as available space, network access, and a supported application restart. Check for compatible updates through the approved source. Clearing cached temporary data is different from clearing all application data; the latter can remove local files, sessions, or settings. Before reinstalling or resetting, verify synchronization, backups, and any account recovery requirements. For battery drain, inspect usage by application and recent activity rather than assuming the battery hardware is faulty. After the change, repeat the affected workflow and confirm that important local content remains available.",
      ],
      question:
        "Before clearing an application’s stored data, what should a technician verify?",
      choices: [
        "Whether local content is backed up or synchronized",
        "That all user files are disposable",
        "That the display brightness is maximum",
      ],
      wrong: [
        "Application data can include valuable unsynchronized local content.",
        "Display brightness does not protect application data from removal.",
      ],
      blank: "Temporary application files are often stored in a {{blank}}.",
      variant:
        "Clearing an app’s {{blank}} removes temporary files rather than intentionally resetting all user data.",
      accepted: ["cache"],
      hint: "Distinguish temporary storage from all application data.",
      flash: [
        "Why compare one failing app with other apps?",
        "It helps distinguish an application-specific fault from a device-wide or network-wide issue.",
      ],
    },
  ],
  [
    {
      number: "4.1",
      title: "Leave a useful support trail",
      summary: "Write records that help the next technician.",
      visual: "support-cycle",
      paragraphs: [
        "A support ticket is a working record of a problem, its impact, and the actions taken. Capture the affected user and device, the exact symptom, the start time, and the business effect. Severity describes impact rather than how strongly a user phrases the request. Use clear factual language and record observable results so another technician can continue without asking the user to repeat everything. Include only the information needed for the support task.",
        "Progress notes should connect an action to its result: what was checked, what changed, and what was observed afterward. A resolution note should explain the fix and how functionality was verified. Asset records connect equipment identifiers to ownership, warranty, licensing, and life-cycle information. A knowledge-base article turns a repeatable resolution into reusable guidance with scope and prerequisites. Avoid placing passwords, recovery codes, or unnecessary personal data into tickets. Follow organizational handling rules and escalate with enough context for the receiving team to act safely.",
      ],
      question: "Which ticket note is most useful to the next technician?",
      choices: [
        "Replaced the tested cable; link restored and file transfer verified",
        "Fixed it somehow",
        "User was annoying",
      ],
      wrong: [
        "A vague note lacks the action and verification needed to understand the repair.",
        "Subjective criticism does not document a technical finding or resolution.",
      ],
      blank:
        "A reusable troubleshooting article belongs in a knowledge {{blank}}.",
      variant:
        "Repeatable support guidance can be published in a knowledge {{blank}}.",
      accepted: ["base"],
      hint: "Think of a searchable collection of support articles.",
      flash: [
        "What should a resolution note connect?",
        "The action taken, the outcome observed, and the way the original functionality was verified.",
      ],
    },
    {
      number: "4.2",
      title: "Make changes with confidence",
      summary: "Plan the change and the way back.",
      visual: "support-cycle",
      paragraphs: [
        "A change request explains what will change, why it is needed, which systems are affected, and who is responsible. Assess the risk, dependencies, expected disruption, and acceptance criteria before scheduling work. A maintenance window sets a planned time for implementation, while a change freeze restricts changes during a sensitive period. Follow the organization’s approval path; an urgent request still needs the appropriate emergency process rather than an undocumented shortcut.",
        "Test the proposed change in a suitable environment and prepare both a backup plan and a rollback plan. A backup preserves recoverable data, while a rollback plan defines the steps and conditions for returning to a previous state. Decide in advance when to stop an unsuccessful implementation so the recovery window remains usable. During execution, record actions and results, communicate status to affected people, and verify the agreed acceptance criteria. Close the change only after the required review and user acceptance, recording lessons that will make the next change safer.",
      ],
      question:
        "What specifically describes how to return to the previous working state?",
      choices: [
        "A rollback plan",
        "A marketing announcement",
        "An asset color label",
      ],
      wrong: [
        "An announcement communicates information but does not provide recovery steps.",
        "An asset label identifies equipment, not the procedure for reversing a change.",
      ],
      blank: "A planned period for implementation is a maintenance {{blank}}.",
      variant:
        "Schedule disruptive work within an approved maintenance {{blank}}.",
      accepted: ["window"],
      hint: "Think of an agreed span of time.",
      flash: [
        "How does a rollback plan differ from a backup?",
        "A backup preserves recoverable data; a rollback plan defines how and when to restore the previous working state.",
      ],
    },
  ],
];
const domains = [
  [
    "mobile-devices",
    "Mobile Devices",
    "Portable hardware, practical connections, and device support.",
    13,
    3,
  ],
  [
    "networking",
    "Networking",
    "Build a clear picture of how devices communicate.",
    23,
    8,
  ],
  [
    "hardware",
    "Hardware",
    "Get to know the components behind every workstation.",
    25,
    8,
  ],
  [
    "virtualization-cloud",
    "Virtualization and Cloud Computing",
    "Understand virtual environments and shared resources.",
    11,
    2,
  ],
  [
    "hardware-troubleshooting",
    "Hardware and Network Troubleshooting",
    "Turn symptoms into evidence and a reliable resolution.",
    28,
    6,
  ],
  [
    "operating-systems",
    "Operating Systems",
    "Install, maintain, and work across everyday platforms.",
    28,
    11,
  ],
  [
    "security",
    "Security",
    "Protect devices, information, and the people using them.",
    28,
    11,
  ],
  [
    "software-troubleshooting",
    "Software Troubleshooting",
    "Find the cause of application and operating system issues.",
    23,
    4,
  ],
  [
    "operational-procedures",
    "Operational Procedures",
    "Bring good judgment and clear process to technical work.",
    21,
    10,
  ],
] as const;
const wrapup =
  "Put it into practice by explaining the decision in your own words. In a support scenario, identify the requirement first, connect it to the relevant technology, and check the result against that requirement. If the evidence changes, revisit your reasoning rather than repeating the same action. Document what you observed so the next person can understand your conclusion.";
for (let index = 0; index < domains.length; index++) {
  const [id, title, description, weight, objectiveCount] = domains[index];
  const exam = index < 5 ? "220-1201" : "220-1202";
  const number = index < 5 ? index + 1 : index - 4;
  const objectives = seeds[index].map((s, si) => {
    const oid = `${exam}-${s.number}`;
    const common = {
      explanation: s.paragraphs[si % 2],
      walkthrough: `First identify what the task requires. ${s.flash[1]} Compare that principle with each choice, then check whether your choice addresses the requirement.`,
      lessonAnchor: "concept",
    };
    const mcAnchor = [
      [0, 0],
      [0, 1],
      [1, 0],
      [0, 0],
      [1, 1],
      [1, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ][index][si]
      ? "application"
      : "concept";
    const blankAnchor = [
      [0, 1],
      [0, 0],
      [0, 1],
      [0, 1],
      [1, 1],
      [1, 1],
      [1, 1],
      [0, 1],
      [1, 0],
    ][index][si]
      ? "application"
      : "concept";
    const cardAnchor = [
      [0, 1],
      [1, 1],
      [1, 1],
      [1, 0],
      [1, 1],
      [0, 0],
      [1, 1],
      [1, 0],
      [1, 1],
    ][index][si]
      ? "application"
      : "concept";
    return {
      id: oid,
      number: s.number,
      title: s.title,
      summary: s.summary,
      visual: s.visual,
      lesson: {
        title: s.title,
        passages: [
          {
            id: "concept",
            heading: "The core idea",
            markdown: s.paragraphs[0],
          },
          {
            id: "application",
            heading: "In the real world",
            markdown: s.paragraphs[1],
          },
          { id: "takeaway", heading: "Make it stick", markdown: wrapup },
        ],
      },
      activities: [
        {
          ...common,
          lessonAnchor: mcAnchor,
          id: `${oid}-check`,
          type: "multiple_choice",
          prompt: s.question,
          correct: "a",
          options: s.choices.map((text, i) => ({
            id: ["a", "b", "c"][i],
            text,
            whyWrong: i
              ? s.wrong[i - 1]
              : "This connects the requirement with the appropriate concept.",
          })),
          walkthrough: `Identify the request in the question. ${s.paragraphs[mcAnchor === "concept" ? 0 : 1]} Now compare the choices with that requirement, ruling out choices that address a different function.`,
        },
        {
          ...common,
          id: `${oid}-recall`,
          type: "fill_in_blank",
          prompt: s.blank,
          variants: [s.variant],
          accepted: s.accepted,
          hint: s.hint,
          lessonAnchor: blankAnchor,
          explanation: `${s.hint} Think about the role described in the sentence and how it differs from the other technologies in this lesson.`,
          walkthrough: `Read the sentence without the blank and name the role it describes. ${s.hint} The relevant term is ${s.accepted[0]}. Use the term to complete the fresh prompt.`,
        },
        {
          ...common,
          lessonAnchor: cardAnchor,
          id: `${oid}-card`,
          type: "flashcard",
          front: s.flash[0],
          back: s.flash[1],
          tags: [id, s.number],
          explanation: s.flash[1],
          walkthrough: `Break the idea into two parts: the purpose and the limitation. ${s.flash[1]} Say the explanation aloud, then try to recall it before turning the card again.`,
        },
      ] as Record<string, unknown>[],
    };
  });
  if (index === 1)
    objectives[0].activities.push({
      id: "network-port-match",
      type: "drag_match",
      prompt: "Match each service to its conventional default port.",
      pairs: [
        { id: "ssh", left: "SSH", right: "22" },
        { id: "dns", left: "DNS", right: "53" },
        { id: "https", left: "HTTPS", right: "443" },
      ],
      explanation:
        "Ports identify service endpoints. Distinguish encrypted terminal access, name resolution, and encrypted web access.",
      walkthrough:
        "SSH uses 22 for a secure terminal, DNS uses 53 for name resolution, and HTTPS uses 443 for encrypted web traffic. Rebuild these pairings in the new arrangement.",
      lessonAnchor: "concept",
    });
  if (index === 3)
    objectives[0].activities.push({
      id: "virtual-stack-order",
      type: "drag_order",
      prompt:
        "Build a type 2 virtualization stack from the physical foundation upward.",
      steps: [
        { id: "hardware", text: "Physical hardware" },
        { id: "host", text: "Host operating system" },
        { id: "hypervisor", text: "Type 2 hypervisor" },
        { id: "guest", text: "Guest operating system" },
      ],
      explanation:
        "A type 2 hypervisor depends on a host operating system, which itself uses the physical hardware. The guest runs above the hypervisor.",
      walkthrough:
        "Start with the physical hardware. Its host OS runs the type 2 hypervisor. The hypervisor presents virtual hardware to the guest OS. Rebuild the stack from bottom to top.",
      lessonAnchor: "concept",
    });
  if (index === 6)
    objectives[0].activities.push({
      id: "security-factor-sort",
      type: "drag_sort",
      prompt: "Place each authentication example into its factor type.",
      categories: [
        { id: "know", label: "Something you know" },
        { id: "have", label: "Something you have" },
      ],
      items: [
        { id: "password", text: "Password", category: "know" },
        { id: "pin", text: "Memorized PIN", category: "know" },
        { id: "key", text: "Hardware security key", category: "have" },
      ],
      explanation:
        "Authentication factors describe the kind of evidence presented. Two knowledge secrets do not become two factor types.",
      walkthrough:
        "A password and memorized PIN depend on knowledge. A physical security key depends on possession. Sort by the type of evidence rather than how many credentials are presented.",
      lessonAnchor: "application",
    });
  const folder = `content/${exam}/${id}`;
  mkdirSync(folder, { recursive: true });
  const meta = { id, exam, number, title, description, weight, objectiveCount };
  writeFileSync(`${folder}/domain.json`, JSON.stringify(meta, null, 2) + "\n");
  for (const o of objectives)
    writeFileSync(
      `${folder}/${o.number}.json`,
      JSON.stringify(o, null, 2) + "\n",
    );
}
