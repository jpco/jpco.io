#! /usr/local/bin/es --

special-files = ()
cp-ftypes     = (ttf ico)
special-cps   = (direct-copy css-copy html-copy)

fn direct-copy src dst {
  for (fi = $src/*.$cp-ftypes) {
    let (fi = `{basename $fi}) {
      if {!~ $fi '*.'^$cp-ftypes} {cp $src/$fi $dst/$fi}
    }
  }
}

fn css-copy src dst {
  for (fi = $src/*.css) {
    let (fi = `{basename $fi}) {
      if {~ $fi '*.css'} break
      python -m csscompressor -o $dst/$fi $src/$fi
    }
  }
}

fn html-copy src dst {
  for (fi = $src/*.html) {
    let (fi = `{basename $fi}) {
      if {~ $fi '*.html'} break
      # TODO: minify embedded CSS in a sane way
      python -c '
import htmlmin
with open("'$src'/'$fi'", "r") as src:
  with open("'$dst'/'$fi'", "w") as dest:
    fdata = src.read()
    dest.write(htmlmin.minify(fdata, remove_comments=True, remove_empty_space=True))'
    }
  }
}

fn process-dir src dst {
  echo Copying $src to $dst
  mkdir -p $dst

  for (cp-fn = $special-cps) $cp-fn $src $dst
  
  # recurse!
  # this could really use tail-call optimization
  for (dir = $src/*/) {
    let (dir = `{basename $dir}) {
      if {~ $dir '*'} break
      process-dir $src/$dir $dst/$dir
    }
  }
}

process-dir src dst
echo 'Uploading to GCS...'
gsutil -m cp -r -c -z html,css,ttf -a public-read dst/* gs://jpco.io/
