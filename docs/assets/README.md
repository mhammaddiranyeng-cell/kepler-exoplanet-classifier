# Assets

| File | What it is |
| --- | --- |
| `profile.jpg` | The portrait shown on the site — a 4:5 crop (376×470) of the original, with the LinkedIn #OPENTOWORK ring cropped out. |
| `profile-original.jpg` | The untouched 608×608 LinkedIn photo, kept as the source for any future re-crop. |

The site loads `profile.jpg` automatically. If that file is ever missing, the
portrait frame falls back to the initials "MD" rather than breaking.

To swap the photo, replace `profile.jpg` with another **4:5 portrait crop**
(taller than wide — roughly 600×750 is ideal). To use a different filename,
update the `<img src="./assets/profile.jpg">` line in `docs/index.html`.
