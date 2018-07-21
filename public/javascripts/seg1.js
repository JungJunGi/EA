var date = new Date();
var month = date.getMonth() + 1;   //현재 달
var hour = date.getHours();   //현재  시
var EnergyText = "";
var tf = false;

//money
d3.json('/segData/money', function (error, data) {
    if (error) throw error;

    money_calculation(data);
    seg1Text();
});

/* 산업용(을) 고압A 선택2  */
function money_calculation(data) {
    var Money_format = d3.format(",");
    var result = 0;
    var season = checkMonth(month);
    var count = 0;

    result += 8320 * data.data[0].contract_demand; // 기본요금*계약전력
    console.log("기본요금 = " + result);

    // 경부하
    if (season == 0 || season == 1) {
        result += data.data[0].electric_power * 56.1
    }
    else if (season == 2) {
        result += data.data[0].electric_power * 63.1
    }
    console.log("기본요금 + 경부하 = " + result);

    // 중간부하
    if (season == 0) {
        result += data.data[1].electric_power * 109.0
    }
    else if (season == 1) {
        result += data.data[1].electric_power * 78.6
    }
    else if (season == 2) {
        result += data.data[1].electric_power * 109.2
    }
    console.log("기본요금 + 경 + 중 = " + result);

    //최대부하
    if (season == 0) {
        result += data.data[2].electric_power * 191.1
    }
    else if (season == 1) {
        result += data.data[2].electric_power * 109.3
    }
    else if (season == 2) {
        result += data.data[2].electric_power * 166.7
    }
    console.log("기본요금 + 경 + 중 + 최대 = " + result);

    console.log("부가가치세, 산업기금 = ", result * 0.1, result * 0.037);
    result += result * 0.1 + result * 0.037; // 부가가치세 + 전력산업기금
    result -= result % 10;

    EnergyText = Money_format(result) + "원 입니다.";
    tf = true;
    console.log("energy : " + EnergyText);
}

function seg1Text() {
    // set text
    var Myenergy = 0;
    while (true) {
        if (tf == true) {
            Myenergy = EnergyText;
            break;
        }
    }

    var seg_time_1 = d3.select('.seg1_time_1');
    var seg_time_2 = d3.select('.seg1_time_2');
    var seg_month_1 = d3.select('.seg1_month_1')
        .attr("transform", "translate(-10,0)");
    var seg_month_2 = d3.select('.seg1_month_2')
        .attr("transform", "translate(-10,0)");
    var seg_energy_1 = d3.select('.seg1_energy_1');
    var seg_energy_2 = d3.select('.seg1_energy_2');

    seg_time_1.append('g');
    seg_time_2.append('g');

    seg_time_1.select('g')
        .append('text')
        .text("현재 시간은 " + hour + "시,")
        .attr('x', 50)
        .attr('y', 70)
        .style("font", "30px sans-serif")
        .style("font-weight", "bold")
        .style("fill", "black");

    seg_time_2.select('g')
        .append('text')
        .text(line1Text(checkTime(month, hour)) + "입니다.")
        .attr('x', 30)
        .style("fill", "#666")
        .attr('y', 20)
        .style("font", "20px sans-serif");

    seg_month_1.append('g');
    seg_month_2.append('g');

    seg_month_1.select('g')
        .append('text')
        .text("이번 달은 " + month + "월 이므로,")
        .attr('x', 50)
        .attr('y', 70)
        .style("font", "30px sans-serif")
        .style("font-weight", "bold")
        .style("fill", "black");

    seg_month_2.select('g')
        .append('text')
        .text(line2Text(checkMonth(month)) + " 차등요금이 적용됩니다.")
        .attr('x', 55)
        .style("fill", "#666")
        .attr('y', 20)
        .style("font", "20px sans-serif");

    seg_energy_1.append('g');
    seg_energy_2.append('g');

    seg_energy_1.select('g')
        .append('text')
        .text("이번 달 전기 요금은")
        .attr('x', 50)
        .attr('y', 70)
        .style("font", "30px sans-serif")
        .style("font-weight", "bold")
        .style("fill", "black");

    seg_energy_2.select('g')
        .append('text')
        .text(Myenergy)
        .attr('x', 90)
        .style("fill", "#666")
        .attr('y', 20)
        .style("font", "20px sans-serif");

}

function checkMonth(m) {
    var dMonth = -1;

    if (m == 6 || m == 7 || m == 8) {
        dMonth = 0; // summer
    } else if (m == 3 || m == 4 || m == 5 || m == 9 || m == 10) {
        dMonth = 1; // spring OR autumn
    } else if (m == 11 || m == 12 || m == 1 || m == 2) {
        dMonth = 2; //winter
    }

    return dMonth;
}

function checkTime(m, d) {
    dMonth = checkMonth(m);
    dHour = d;

    // summer
    if (dMonth == 0) {
        switch (dHour) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: return 0;
            case 9: return 1;
            case 10:
            case 11: return 2;
            case 12: return 1;
            case 13:
            case 14:
            case 15:
            case 16: return 2;
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22: return 1;
            case 23:
            case 24: return 0;
            default: return -1;
        }
    } else if (dMonth == 1) { // spring OR autumn
        switch (dHour) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: return 0;
            case 9: return 1;
            case 10:
            case 11: return 2;
            case 12: return 1;
            case 13:
            case 14:
            case 15:
            case 16: return 2;
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22: return 1;
            case 23:
            case 24: return 0;
            default: return -1;
        }
    } else if (dMonth == 2) { //winter
        switch (dHour) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: return 0;
            case 9: return 1;
            case 10:
            case 11: return 2;
            case 12:
            case 13:
            case 14:
            case 15:
            case 16: return 1;
            case 17:
            case 18:
            case 19:
            case 20: return 2;
            case 21:
            case 22: return 1;
            case 23:
            case 24: return 0;
            default: return -1;
        }
    } else {
        return -1;
    }
}

function line1Text(num) {
    var text;

    if (num == 0) {
        text = " 지금은 경부하 시간대";
    } else if (num == 1) {
        text = " 지금은 중간부하 시간대";
    } else if (num == 2) {
        text = " 지금은 최대부하 시간대";
    } else {
        text = "null";
    }

    return text;
}

function line2Text(num) {
    var text;

    if (num == 0) { // summer
        text = " 여름철";
    } else if (num == 1) { // spring OR autumn
        text = " 봄·가을철";
    } else if (num == 2) { // winter
        text = " 겨울철";
    } else {
        text = "null";
    }

    return text;
}
