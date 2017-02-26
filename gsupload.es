#! /usr/local/bin/es --

fn process-dir src dst {
  echo Copying $src to $dst
  mkdir -p $dst

  cp-ftypes = (ttf ico)
  for (fi = $src/*.$cp-ftypes) {
    let (fi = `{basename $fi}) {
      if {!~ $fi '*.'^$cp-ftypes} {cp $src/$fi $dst/$fi}
    }
  }

  # minify and copy CSS
  for (fi = $src/*.css) {
    let (fi = `{basename $fi}) {
      if {~ $fi '*.css'} break
      python -m csscompressor -o $dst/$fi $src/$fi
    }
  }

  # minify and copy HTML
  for (fi = $src/*.html) {
    let (fi = `{basename $fi}) {
      if {~ $fi '*.html'} break
      python -c '
import htmlmin
with open("'$src'/'$fi'", "r") as src:
  with open("'$dst'/'$fi'", "w") as dest:
    fdata = src.read()
    dest.write(htmlmin.minify(fdata, remove_comments=True, remove_empty_space=True))'
    }
  }

  # recurse!
  for (dir = $src/*/) {
    let (dir = `{basename $dir}) {
      if {~ $dir '*'} break
      process-dir $src/$dir $dst/$dir
    }
  }
}

process-dir src dst
gsutil cp -r -c -z html,css,ttf -a public-read -L upload.log dst/* gs://jpco-io-static/
