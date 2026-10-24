import pathlib
p=pathlib.Path(r'C:\Users\nicky\Desktop\Projects\Ikageng health center\website-upload\index.html')
t=p.read_text(encoding='utf-8')
phone_svg='<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
old='          <a class="btn btn--on-dark btn--lg" href="services.html">Explore Our Services</a>'
new='''          <a class="btn btn--on-dark btn--lg" href="tel:+27182950174">
            {svg}
            Call&nbsp;018&nbsp;295&nbsp;0174
          </a>
          <a class="btn btn--on-dark btn--lg" href="services.html">Explore Our Services</a>'''.format(svg=phone_svg)
guard='href="tel:+27182950174">\n            {svg}\n            Call&nbsp;018'.format(svg=phone_svg)
if guard not in t:
    assert old in t
    t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
print('done')
PY