gcloud app versions list --sort-by "~LAST_DEPLOYED" | tail -n +5 | while read detail
do
  SERVING_STATUS=`echo ${detail} | awk '{print $5}'`
  VERSION=`echo ${detail} | awk '{print $2}'`
  if [ "${SERVING_STATUS}" = 'STOPPED' ]
  then
    gcloud app versions delete ${VERSION} --quiet
  fi
done