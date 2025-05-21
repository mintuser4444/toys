#!/bin/bash
# Edited September 4, 2006
# then edited April 30, 2015 to account for laptop lid closing

# checks if its running in an xterm; if so it will set the title
if echo $TERM | grep -q xterm
then
    XTERM=1
else
    XTERM=0
fi

# checks if $1 is a number of minutes, a time. or a time to wait
# converts a time or time to wait into a number of minutes
case $1 in
-h|--help)
	echo "timer [-u] time"
;;
-u|--until)
	ct=`date +"%s"`
	untils=`date --date="$2" +"%s"`
	if (($untils < $ct)); then
	    untils=$(($untils + 86400))
	fi
#	# 10# to make sure 08 and 09 are interpreted in decimal
#	uth=$((10#`echo $2 | awk -F : '{print $1}'`))
#	utm=$((10#`echo $2 | awk -F : '{print $2}'`))
#	cth=$((10#`date +"%H"`))
#	ctm=$((10#`date +"%M"`))
#	wait_time=$(((ath-cth+24)%24*60+atm-ctm))
#	if((ath<10)); then #because everybody likes a leading 0
#	    uth=0$uth
#	fi
#	if((atm<10)); then #because everybody likes a leading 0
#	    utm=0$utm
#	fi
#	if((cth<10)); then #because everybody likes a leading 0
#	    cth=0$cth
#	fi
#	if((ctm<10)); then #because everybody likes a leading 0
#	    ctm=0$ctm
#	fi
#	echo from $cth:$ctm to $uth:$utm
;;
*)
if echo $1 | grep -vq : ; then
    wait_time=$(($1*60))
else
    wth=`echo $1 | awk -F : '{print $1}'`
    wtm=`echo $1 | awk -F : '{print $2}'`
    wait_time=$((wth*3600+wtm*60))
fi
untils=$((`date +"%s"` + wait_time))
;; esac

#waits each minute and prints how many there are left
#wait_time=$((wth*60+wtm))
#wth=$((wait_time/60))
#wtm=$((wait_time%60))
#if((wtm<10)); then
#    wtm=0$wtm
#fi
#echo "waiting $wait_time minutes ($wth:$wtm)..."

untilstring=`date --date=@$untils +"%H:%M"`
echo "waiting until $untilstring ($untils)..." 
while true; do
    ct=`date +"%s"`
    if (($ct >= $untils)); then
	break
    fi
    timetowait=$(($untils - $ct))
    if (($timetowait > 60)); then
	scheduleadjustment=$(($timetowait%60))
	minutes=$(($timetowait/60))
	if (($scheduleadjustment > 0)); then
	    echo "schedule adjustment of $scheduleadjustment seconds ($minutes minutes left)..."
	    if [ $XTERM ]
		then setname "t-$minutes"
	    fi
	    sleep $scheduleadjustment
	    continue
	fi
	minutes=$(($timetowait/60))
	echo $minutes minutes left...
	if [ $XTERM ]
	then setname "t-$minutes"
	fi
	sleep 60
	continue
    fi
done

ct=`date +"%s"`
if (($untils < $ct + 60)); then
    xt=$(($ct-$untils))
    xts=$(($xt%60))
    xtm=$(( ($xt/60)%60 ))
    xth=$(( $xt/3600 ))
    if (($xts < 10)); then
	xts=0$xts
    fi
    if (($xtm < 10)); then
	xtm=0$xtm
    fi
    exceedstring=$xth:$xtm:$xts
    if [ $XTERM ]
    then setname "t+$exceedstring"
    fi
    echo "blew right through it (by $exceedstring)"
    exit 1
fi

echo "time's up!"
if [ $XTERM ]
    then setname "timesup!"
fi
